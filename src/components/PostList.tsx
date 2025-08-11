"use client";

import { useState, useEffect } from 'react';
import { PostWithRelations } from "@/types/prisma";
import UserPostCard from "./UserPostCard";
import CreatePostForm from './CreatePostForm';

interface PostListProps {
  initialPosts: PostWithRelations[];
  showInteractions?: boolean;
}

export default function PostList({ initialPosts, showInteractions = true }: PostListProps) {
  const [posts, setPosts] = useState<PostWithRelations[]>(initialPosts);

  useEffect(() => {
    setPosts(initialPosts); // Update posts state when initialPosts prop changes
  }, [initialPosts]);

  const handlePostCreated = (newPost: PostWithRelations) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  const handlePostUpdate = (updatedPost: PostWithRelations) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  const handlePostDeleted = (postId: number) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  }

  return (
    <div>
      <CreatePostForm onPostCreated={handlePostCreated} />
      {posts.map((post) => (
        <UserPostCard 
          key={post.id} 
          post={post} 
          onPostUpdate={handlePostUpdate} 
          onPostDeleted={handlePostDeleted}
          showInteractions={showInteractions}
        />
      ))}
    </div>
  );
}