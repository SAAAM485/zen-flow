"use client";

import { PostWithRelations } from "@/types/prisma";
import UserPostCard from "./UserPostCard";
import CreatePostForm from './CreatePostForm';

interface PostListProps {
  posts: PostWithRelations[];
  onPostUpdate: (updatedPost: PostWithRelations) => void;
  onPostDeleted: (postId: number) => void;
  onPostCreated: (newPost: PostWithRelations) => void;
  lastPostRef: (node: HTMLDivElement) => void;
  isLoading: boolean;
  hasMore: boolean;
}

export default function PostList({ 
  posts, 
  onPostUpdate, 
  onPostDeleted,
  onPostCreated,
  lastPostRef,
  isLoading,
  hasMore
}: PostListProps) {

  return (
    <div>
      <CreatePostForm onPostCreated={onPostCreated} />
      {posts.map((post, index) => {
        if (posts.length === index + 1) {
          return (
            <div ref={lastPostRef} key={post.id}>
              <UserPostCard 
                post={post} 
                onPostUpdate={onPostUpdate} 
                onPostDeleted={onPostDeleted}
              />
            </div>
          );
        } else {
          return (
            <UserPostCard 
              key={post.id} 
              post={post} 
              onPostUpdate={onPostUpdate} 
              onPostDeleted={onPostDeleted}
            />
          );
        }
      })}
      {isLoading && <p className="text-center p-4">Loading more posts...</p>}
      {!hasMore && posts.length > 0 && <p className="text-center p-4">You&apos;ve reached the end.</p>}
      {posts.length === 0 && !isLoading && <p className="text-center p-4">No posts to show.</p>}
    </div>
  );
}