"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { PostWithRelations } from "@/types/prisma";
import UserPostCard from "./UserPostCard";
import CreatePostForm from './CreatePostForm';

const POST_PAGE_SIZE = 10; // Same as in the backend

interface PostListProps {
  initialPosts: PostWithRelations[];
  mode: string;
  currentUserId?: number;
}

export default function PostList({ initialPosts, mode }: PostListProps) {
  const [posts, setPosts] = useState<PostWithRelations[]>(initialPosts);
  const [page, setPage] = useState(2); // Start fetching from the second page
  const [hasMore, setHasMore] = useState(initialPosts.length === POST_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  
  const observer = useRef<IntersectionObserver | null>(null);

  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/posts?mode=${mode}&page=${page}`);
      const newPosts: PostWithRelations[] = await res.json();
      
      setPosts(prevPosts => [...prevPosts, ...newPosts]);
      setPage(prevPage => prevPage + 1);
      setHasMore(newPosts.length === POST_PAGE_SIZE);
    } catch (error) {
      console.error("Failed to fetch more posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, mode, isLoading, hasMore]);

  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadMorePosts]);

  useEffect(() => {
    // Reset posts when the initialPosts (and thus the mode) changes.
    setPosts(initialPosts);
    setPage(2);
    setHasMore(initialPosts.length === POST_PAGE_SIZE);
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
      {posts.map((post, index) => {
        if (posts.length === index + 1) {
          return (
            <div ref={lastPostElementRef} key={post.id}>
              <UserPostCard 
                post={post} 
                onPostUpdate={handlePostUpdate} 
                onPostDeleted={handlePostDeleted}
              />
            </div>
          );
        } else {
          return (
            <UserPostCard 
              key={post.id} 
              post={post} 
              onPostUpdate={handlePostUpdate} 
              onPostDeleted={handlePostDeleted}
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