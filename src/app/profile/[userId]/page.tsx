"use client";

import { useState, useEffect, use } from 'react';
import { useSession } from "next-auth/react";

import Image from "next/image";
import UserPostCard from "@/components/UserPostCard";
import { PostWithRelations } from "@/types/prisma";
import { toast } from "sonner";

// Define a type for the user profile data
interface UserProfile {
    id: number;
    name: string;
    image: string | null;
    createdAt: string;
    _count: {
        followers: number;
        following: number;
    };
    posts: PostWithRelations[];
}

export default function ProfilePage({
    params,
}: {
    params: { userId: string };
}) {
    const { data: session, status } = useSession();
    const { userId } = use(params);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [userPosts, setUserPosts] = useState<PostWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // State for the editable form
    const [name, setName] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null); // Current image URL from profile or new upload

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/users/${userId}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch profile");
                }
                const data: UserProfile = await res.json();
                setProfile(data);
                setUserPosts(data.posts || []);
                // Initialize form fields if it's the current user's profile
                if (session?.user?.id === parseInt(userId, 10)) {
                    setName(data.name || "");
                    setImageUrl(data.image || null);
                }
            } catch (err: unknown) {
                setProfile(null); // Ensure profile is null on error
                if (err instanceof Error) {
                    toast.error(err.message);
                } else {
                    toast.error("An unknown error occurred");
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchProfile();
        }
    }, [userId, session]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleClearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setImageUrl(null); // Also clear the current URL if user wants to remove image
        const fileInput = document.getElementById('image-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handlePostUpdate = (updatedPost: PostWithRelations) => {
        setUserPosts((prevPosts) =>
            prevPosts.map((post) =>
                post.id === updatedPost.id ? updatedPost : post
            )
        );
    };

    const handlePostDeleted = (postId: number) => {
        setUserPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile || session?.user?.id !== parseInt(userId, 10)) return; // Only allow current user to edit their profile

        let newImageUrl = imageUrl; // Start with current URL

        try {
            if (imageFile) {
                // Upload new image file
                const formData = new FormData();
                formData.append('files', imageFile); // Use 'files' as key for consistency with /api/upload

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error('Failed to upload image');
                }
                const { blobs } = await uploadRes.json();
                if (blobs && blobs.length > 0) {
                    newImageUrl = blobs[0].url; // Get the URL of the first uploaded image
                } else {
                    newImageUrl = null; // No image uploaded or error
                }
            } else if (imagePreview === null && imageUrl !== null) {
                // User cleared image but no new file selected, means they want to remove it
                newImageUrl = null;
            }

            const res = await fetch(`/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, image: newImageUrl }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            const updatedProfile: UserProfile = await res.json();
            setProfile(updatedProfile);
            setImageUrl(updatedProfile.image); // Update imageUrl state with the new one from backend
            setImageFile(null); // Clear file input
            setImagePreview(null); // Clear preview
            toast.success("Profile updated successfully!");
        } catch (err: unknown) {
            if (err instanceof Error) {
                toast.error(err.message);
            } else {
                toast.error("An unknown error occurred");
            }
        }
    };

    if (isLoading || status === "loading") {
        return <div className="text-center p-10">Loading...</div>;
    }

    if (!profile) {
        return <div className="text-center p-10">Could not load profile.</div>;
    }

    const isCurrentUser = session?.user?.id === parseInt(userId, 10);

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Profile</h1>
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                <div className="flex items-center mb-4">
                    <Image // 使用 Image 組件
                        src={imagePreview || imageUrl || profile.image || "/default-avatar.png"}
                        alt={profile.name || "User"}
                        width={96} // 設定寬度 (24 * 4 = 96)
                        height={96} // 設定高度 (24 * 4 = 96)
                        className="w-24 h-24 rounded-full mr-6 object-cover"
                    />
                    <div>
                        <h2 className="text-2xl font-bold">{profile.name}</h2>
                        <p className="text-gray-500">
                            Joined on{" "}
                            {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex space-x-4 mt-2">
                            <span>
                                <b>{profile._count.followers}</b> Followers
                            </span>
                            <span>
                                <b>{profile._count.following}</b> Following
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {isCurrentUser && (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label
                                htmlFor="image-upload"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Profile Image
                            </label>
                            <input
                                type="file"
                                id="image-upload"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="mt-1 block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                            />
                            {(imagePreview || imageUrl) && (
                                <button
                                    type="button"
                                    onClick={handleClearImage}
                                    className="mt-2 text-red-600 hover:text-red-800 text-sm"
                                >
                                    Clear Image
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Save Changes
                        </button>
                    </form>
                </div>
            )}

            <div className="mt-6">
                <h2 className="text-2xl font-bold mb-4">
                    {profile.name}&apos;s Posts
                </h2>
                {userPosts.length > 0 ? (
                    userPosts.map((post) => (
                        <UserPostCard 
                            key={post.id} 
                            post={post} 
                            onPostUpdate={handlePostUpdate} 
                            onPostDeleted={handlePostDeleted} 
                        />
                    ))
                ) : (
                    <p className="text-center text-secondary-text">
                        No posts found.
                    </p>
                )}
            </div>
        </div>
    );
}