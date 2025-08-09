"use client";

import Image from "next/image";
import Link from "next/link";
import { PostWithRelations } from "@/types/prisma";

interface UserPostCardProps {
    post: PostWithRelations;
}

export default function UserPostCard({ post }: UserPostCardProps) {
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
            </div>
            <Link href={`/posts/${post.id}`}>
                <div className="cursor-pointer">
                    {post.text && (
                        <p className="text-primary-text mb-4">{post.text}</p>
                    )}
                    {post.imageUrls && post.imageUrls.length > 0 && (
                        <div className="mb-4 -mx-6 md:mx-0">
                            <div className={`grid gap-1 ${post.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {post.imageUrls.map((url, index) => (
                                    <div key={index} className="relative aspect-video bg-secondary-bg">
                                        <Image
                                            src={url}
                                            alt={`Post image ${index + 1}`}
                                            fill
                                            className="object-contain md:rounded-md"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
}
