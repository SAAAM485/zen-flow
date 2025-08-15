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
import React from 'react';

const reactionIcons: Record<ReactionType, React.FC<React.SVGProps<SVGSVGElement>>> = {
    LIKE: (props) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-1.9 3.8z" />
        </svg>
    ),
    INSIGHTFUL: (props) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.707.707M12 21v-1m-6.364-1.636l.707-.707" />
        </svg>
    ),
    THANKS: (props) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.672l1.318-1.354a4.5 4.5 0 116.364 6.364L12 21.272l-7.682-7.682a4.5 4.5 0 010-6.364z" />
        </svg>
    ),
    HAHA: (props) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

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
            className="bg-secondary-bg shadow-md rounded-lg p-4 sm:p-6 mb-6"
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
                        <div className="mb-4">
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
                 <div className="flex items-center justify-around md:justify-start md:space-x-2 mb-4">
                    {Object.values(ReactionType).map((type) => {
                        const Icon = reactionIcons[type];
                        return (
                            <button
                                key={type}
                                onClick={() => handleReaction(type)}
                                className={`flex items-center justify-center space-x-2 px-3 py-1 rounded-full border text-sm transition-colors ${currentUserReactionType === type
                                        ? "bg-primary-text text-secondary-bg border-primary-text"
                                        : "bg-secondary-bg text-primary-text border-border-line hover:bg-hover-bg"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-semibold text-xs">
                                    {post.postLikes.filter((like) => like.type === type).length}
                                </span>
                            </button>
                        )
                    })}
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
