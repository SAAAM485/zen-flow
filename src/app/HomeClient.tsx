"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PostList from "@/components/PostList";
import PostSkeleton from '@/components/PostSkeleton';
import { PostWithRelations } from '@/types/prisma';

const POST_PAGE_SIZE = 10;

export default function HomeClient() {
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    
    const [posts, setPosts] = useState<PostWithRelations[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true); // Start with loading true
    
    const mode = searchParams.get('mode') || (session ? 'following' : 'explore');

    const observer = useRef<IntersectionObserver | null>(null);

    const loadMorePosts = useCallback(async (isInitialLoad = false) => {
        if (isLoading && !isInitialLoad) return;
        setIsLoading(true);

        const targetPage = isInitialLoad ? 1 : page;

        try {
            const res = await fetch(`/api/posts?mode=${mode}&page=${targetPage}`);
            const newPosts: PostWithRelations[] = await res.json();
            
            setPosts(prevPosts => isInitialLoad ? newPosts : [...prevPosts, ...newPosts]);
            setPage(targetPage + 1);
            setHasMore(newPosts.length === POST_PAGE_SIZE);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, mode, isLoading]);

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
        // Trigger fetch when mode changes
        setPosts([]);
        setPage(1);
        setHasMore(true);
        setIsLoading(true);
        loadMorePosts(true); // Pass true for initial load
    }, [mode, loadMorePosts]); // FIX: Added loadMorePosts to dependency array

    return (
        <main className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
            {isLoading && posts.length === 0 ? (
                <div>
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            ) : (
                <PostList 
                    posts={posts}
                    onPostUpdate={ (updatedPost) => setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p)) }
                    onPostDeleted={ (postId) => setPosts(posts.filter(p => p.id !== postId)) }
                    onPostCreated={ (newPost) => setPosts([newPost, ...posts]) }
                    lastPostRef={lastPostElementRef}
                    isLoading={isLoading}
                    hasMore={hasMore}
                />
            )}
        </main>
    );
}
