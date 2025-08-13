"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { UserProfile } from "@/types/prisma"; // Assuming UserProfile is exported from here

// Define a type for FollowRequest with the 'from' user included
interface FollowRequestWithFromUser {
    id: number;
    fromId: number;
    toId: number;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    createdAt: string;
    from: UserProfile; // The user who sent the request
}

export default function FollowRequestNotification() {
    const { data: session, status } = useSession();
    const [pendingRequests, setPendingRequests] = useState<
        FollowRequestWithFromUser[]
    >([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchPendingRequests = async () => {
            if (session?.user?.id && status === "authenticated") {
                try {
                    const res = await fetch("/api/follow-requests");
                    if (!res.ok) throw new Error("Failed to fetch follow requests");
                    const data: FollowRequestWithFromUser[] = await res.json();
                    setPendingRequests(data);
                } catch (error) {
                    console.error("Error fetching pending requests:", error);
                    toast.error("Failed to load follow requests");
                }
            }
        };

        fetchPendingRequests();
        // Set up an interval to refetch requests periodically
        const interval = setInterval(fetchPendingRequests, 60000); // Refetch every 60 seconds
        return () => clearInterval(interval);
    }, [session, status]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAction = async (
        requestId: number,
        action: "ACCEPTED" | "REJECTED"
    ) => {
        try {
            const res = await fetch(`/api/follow-requests/${requestId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action }),
            });

            if (!res.ok)
                throw new Error(`Failed to ${action.toLowerCase()} request`);

            setPendingRequests((prev) =>
                prev.filter((req) => req.id !== requestId)
            );
            toast.success(`Request ${action.toLowerCase()}!`);

            // Optionally, trigger a re-fetch of profile data if follower counts need to update immediately
            // This would require a context or global state update, or a full page refresh.
        } catch (error) {
            console.error(
                `Error ${action.toLowerCase()} follow request:`,
                error
            );
            toast.error(`Failed to ${action.toLowerCase()} request`);
        }
    };

    if (!session?.user?.id || status !== "authenticated") {
        return null; // Don't render if not logged in
    }

    const hasPending = pendingRequests.length > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
                className="relative p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary-text"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {hasPending && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {pendingRequests.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-secondary-bg rounded-md shadow-lg py-1 z-20">
                    <div className="block px-4 py-2 text-xs text-gray-400">
                        Follow Requests
                    </div>
                    {pendingRequests.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">
                            No new requests.
                        </div>
                    ) : (
                        pendingRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex items-center justify-between px-4 py-2 hover:bg-gray-100"
                            >
                                <Link
                                    href={`/profile/${request.from.id}`}
                                    className="flex items-center flex-grow"
                                >
                                    <Image
                                        src={
                                            request.from.image ??
                                            "/default-avatar.png"
                                        }
                                        alt={request.from.name ?? "User Avatar"}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full mr-3"
                                    />
                                    <span className="font-semibold text-primary-text">
                                        {request.from.name}
                                    </span>
                                </Link>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() =>
                                            handleAction(request.id, "ACCEPTED")
                                        }
                                        className="bg-blue-500 text-white text-xs px-3 py-1 rounded-md hover:bg-blue-600"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleAction(request.id, "REJECTED")
                                        }
                                        className="bg-gray-300 text-gray-800 text-xs px-3 py-1 rounded-md hover:bg-gray-400"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
