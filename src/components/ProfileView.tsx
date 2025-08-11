
"use client";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import Image from "next/image";
import UserPostCard from "@/components/UserPostCard";
import FollowButton from '@/components/FollowButton';
import { PostWithRelations, UserProfile } from "@/types/prisma";
import { toast } from "sonner";

interface ProfileViewProps {
  initialProfile: UserProfile | null;
  initialFollowStatus: string | null;
  initialIncomingRequestId: number | null;
  targetUserId: number;
}

export default function ProfileView({ 
  initialProfile, 
  initialFollowStatus,
  initialIncomingRequestId,
  targetUserId 
}: ProfileViewProps) {
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
    const [userPosts, setUserPosts] = useState<PostWithRelations[]>(initialProfile?.posts || []);
    const [followStatus, setFollowStatus] = useState<string | null>(initialFollowStatus);
    const [incomingRequestId, setIncomingRequestId] = useState<number | null>(initialIncomingRequestId);

    // State for the editable form
    const [name, setName] = useState(initialProfile?.name || "");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(initialProfile?.image || null);

    const handleFollowStatusChange = (newStatus: string) => {
        setFollowStatus(newStatus);
        setProfile(prevProfile => {
            if (!prevProfile) return null;
            const currentFollowers = prevProfile._count.followers;
            let newFollowers = newStatus === 'following' ? currentFollowers + 1 : Math.max(0, currentFollowers - 1);
            return {
                ...prevProfile,
                _count: { ...prevProfile._count, followers: newFollowers },
            };
        });
    };

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
        setImageUrl(null);
        const fileInput = document.getElementById('image-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handlePostUpdate = (updatedPost: PostWithRelations) => {
        setUserPosts(p => p.map(post => post.id === updatedPost.id ? updatedPost : post));
    };

    const handlePostDeleted = (postId: number) => {
        setUserPosts(p => p.filter(post => post.id !== postId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile || session?.user?.id !== targetUserId) return;

        let newImageUrl = imageUrl;
        try {
            if (imageFile) {
                const formData = new FormData();
                formData.append('files', imageFile);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!uploadRes.ok) throw new Error('Failed to upload image');
                const { blobs } = await uploadRes.json();
                newImageUrl = blobs?.[0]?.url || null;
            }

            const res = await fetch(`/api/users/${targetUserId}`, {
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
            setImageUrl(updatedProfile.image);
            setImageFile(null);
            setImagePreview(null);
            toast.success("Profile updated successfully!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An unknown error occurred");
        }
    };

    if (!profile) {
        return <div className="text-center p-10">Could not load profile.</div>;
    }

    const isCurrentUser = session?.user?.id === targetUserId;

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                <div className="flex items-start">
                    <Image
                        src={imagePreview || imageUrl || profile.image || "/default-avatar.png"}
                        alt={profile.name || "User"}
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full mr-6 object-cover"
                    />
                    <div className="flex-grow">
                        <h2 className="text-2xl font-bold">{profile.name}</h2>
                        <p className="text-gray-500">Joined on {new Date(profile.createdAt).toLocaleDateString()}</p>
                        <div className="flex space-x-4 mt-2">
                            <span><b>{profile._count.followers}</b> Followers</span>
                            <span><b>{profile._count.following}</b> Following</span>
                        </div>
                    </div>
                    {!isCurrentUser && status === 'authenticated' && (
                        <FollowButton 
                            initialStatus={followStatus}
                            targetUserId={targetUserId}
                            incomingRequestId={incomingRequestId}
                            onStatusChange={handleFollowStatusChange}
                        />
                    )}
                </div>
            </div>

            {isCurrentUser && (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">Profile Image</label>
                            <input
                                type="file"
                                id="image-upload"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {(imagePreview || imageUrl) && (
                                <button type="button" onClick={handleClearImage} className="mt-2 text-red-600 hover:text-red-800 text-sm">Clear Image</button>
                            )}
                        </div>
                        <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Save Changes
                        </button>
                    </form>
                </div>
            )}

            <div className="mt-6">
                <h2 className="text-2xl font-bold mb-4">{profile.name}&apos;s Posts</h2>
                {userPosts.length > 0 ? (
                    userPosts.map((post) => (
                        <UserPostCard key={post.id} post={post} onPostUpdate={handlePostUpdate} onPostDeleted={handlePostDeleted} />
                    ))
                ) : (
                    <p className="text-center text-secondary-text">No posts found.</p>
                )}
            </div>
        </div>
    );
}
