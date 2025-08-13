"use client";

import { useState, useContext } from 'react';
import Image from "next/image";
import Link from "next/link";
import { PostWithRelations } from "@/types/prisma";
import { useSession } from 'next-auth/react';
import { ReactionType } from '@prisma/client';
import { toast } from 'sonner';
import { LoginPromptContext } from '@/context/LoginPromptContext';
import ConfirmModal from './ConfirmModal';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface UserPostCardProps {
    post: PostWithRelations;
    onPostUpdate: (updatedPost: PostWithRelations) => void;
    onPostDeleted: (postId: number) => void;
    showInteractions?: boolean; // Make this optional, default to true
}

export default function UserPostCard({ post, onPostUpdate, onPostDeleted, showInteractions = true }: UserPostCardProps) {
    const { data: session } = useSession();
    const { setShowLoginPrompt } = useContext(LoginPromptContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    

    const handleReaction = async (type: ReactionType) => {
        if (!session?.user?.id) {
            setShowLoginPrompt(true);
            return;
        }

        const currentUserReaction = post.postLikes.find(
            (like) => like.userId === session.user.id
        );

        const originalPost = JSON.parse(JSON.stringify(post)); // Deep copy

        // Optimistic update
        let updatedPost;
        if (currentUserReaction && currentUserReaction.type === type) {
            // User is un-reacting
            updatedPost = {
                ...post,
                postLikes: post.postLikes.filter(
                    (like) => like.userId !== session.user.id
                ),
            };
        } else {
            // User is reacting or changing reaction
            const newLike = {
                userId: session.user.id,
                type,
                id: Math.random(), // Temporary ID for optimistic update
                postId: post.id,
                createdAt: new Date(),
                user: { id: session.user.id }, // Add the user object to match the type
            };
            updatedPost = {
                ...post,
                postLikes: [
                    ...post.postLikes.filter(
                        (like) => like.userId !== session.user.id
                    ),
                    newLike,
                ],
            };
        }
        onPostUpdate(updatedPost);

        try {
            if (currentUserReaction && currentUserReaction.type === type) {
                await fetch(`/api/posts/${post.id}/reactions`, { method: "DELETE" });
            } else {
                await fetch(`/api/posts/${post.id}/reactions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type }),
                });
            }
        } catch (error) {
            console.error("Error handling reaction:", error);
            toast.error("Failed to update reaction");
            onPostUpdate(originalPost); // Revert on failure
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Post deleted');
            onPostDeleted(post.id);
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error('Failed to delete post');
        }
        setIsModalOpen(false);
    };

    const currentUserReactionType = post.postLikes.find(like => like.userId === session?.user?.id)?.type;

    return (
        <div
            key={post.id}
            className="bg-secondary-bg shadow-md rounded-lg p-6 mb-6"
        >
            <div className="flex items-center mb-4">
                <Link
                    href={`/profile/${post.author.id}`}
                    className="flex items-center"
                >
                    <Image
                        src={post.author.image ?? "/default-avatar.png"}
                        alt={post.author.name ?? "User Avatar"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full mr-4"
                    />
                    <div>
                        <p className="font-semibold hover:underline">
                            {post.author.name}
                        </p>
                        <p className="text-sm text-secondary-text">
                            {new Date(post.createdAt).toLocaleString()}
                        </p>
                    </div>
                </Link>
                {session?.user?.id === post.authorId && (
                    <div className="ml-auto">
                        <button onClick={() => setIsModalOpen(true)} className='text-red-500 hover:text-red-700'>Delete</button>
                    </div>
                )}
            </div>
            <Link href={`/posts/${post.id}`}>
                <div className="cursor-pointer">
                    {post.text && (
                        <p className="text-primary-text mb-4">{post.text}</p>
                    )}
                    {post.imageUrls && post.imageUrls.length > 0 && (
                        <div className="mb-4 -mx-6 md:mx-0">
                            <Swiper
                                modules={[Navigation, Pagination]}
                                spaceBetween={10}
                                slidesPerView={1}
                                navigation
                                pagination={{ clickable: true }}
                                loop={true}
                                className="mySwiper rounded-lg"
                            >
                                {post.imageUrls.map((url, index) => (
                                    <SwiperSlide key={index}>
                                        <div className="relative w-full aspect-video bg-secondary-bg">
                                            <Image
                                                src={url}
                                                alt={`Post image ${index + 1}`}
                                                fill
                                                className="object-contain"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    )}
                </div>
            </Link>
            {showInteractions && (
                 <div className="flex items-center space-x-4 mb-4">
                    {Object.values(ReactionType).map((type) => (
                        <button
                            key={type}
                            onClick={() => handleReaction(type)}
                            className={`px-3 py-1 rounded-full border text-sm text-primary-text hover:bg-primary-text hover:text-secondary-bg transition-colors ${
                                currentUserReactionType === type
                                    ? "bg-primary-text text-secondary-bg border-primary-text"
                                    : "bg-secondary-bg border-border-line"
                            }`}
                        >
                            {type} {post.postLikes.filter((like) => like.type === type).length}
                        </button>
                    ))}
                </div>
            )}
            <ConfirmModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Post"
                description="Are you sure you want to delete this post? This cannot be undone."
            />
            
        </div>
    );
}
