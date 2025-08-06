"use client";

import Image from 'next/image';
import Link from 'next/link';
import { PostWithRelations } from '@/types/prisma';
import { ReactionType } from '@prisma/client';

interface UserPostCardProps {
  post: PostWithRelations;
}

export default function UserPostCard({ post }: UserPostCardProps) {
  return (
    <div key={post.id} className="bg-secondary-bg shadow-md rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <Link href={`/profile/${post.author.id}`} className="flex items-center">
          <Image src={post.author.image ?? "/default-avatar.png"} alt={post.author.name ?? "User Avatar"} width={40} height={40} className="w-10 h-10 rounded-full mr-4" />
          <div>
            <p className="font-semibold hover:underline">{post.author.name}</p>
            <p className="text-sm text-secondary-text">{new Date(post.createdAt).toLocaleString()}</p>
          </div>
        </Link>
      </div>
      <Link href={`/posts/${post.id}`}>
        <div className="cursor-pointer">
          {post.text && <p className="text-primary-text mb-4">{post.text}</p>}
          {post.imageUrl && (
            <div className="mb-4">
              <Image src={post.imageUrl} alt="Post image" width={500} height={300} className="rounded-md object-cover w-full" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex items-center space-x-4 mb-4">
        {Object.values(ReactionType).map((type) => (
          <button key={type} className="px-3 py-1 rounded-full border border-border-line bg-secondary-bg text-primary-text">
            {type} ({post.postLikes.filter(like => like.type === type).length})
          </button>
        ))}
      </div>
    </div>
  );
}
