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
    const { data: sessionData, status: sessionStatus } = useSession(); // FIX 1: Destructure data and status
    
    const [posts, setPosts] = useState<PostWithRelations[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    
    const modeParam = searchParams.get('mode'); // Renamed to avoid conflict with useEffect dependency

    const observer = useRef<IntersectionObserver | null>(null);

    // Effect for initial load and when the mode changes
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setPosts([]); // Clear old posts
            setPage(1);   // Reset page counter
            try {
                // Calculate mode inside useEffect to ensure it uses latest session status
                const currentMode = modeParam || (sessionStatus === 'authenticated' ? 'following' : 'explore'); // FIX 1: Use sessionStatus
                const res = await fetch(`/api/posts?mode=${currentMode}&page=1`);
                const initialPosts: PostWithRelations[] = await res.json();
                setPosts(initialPosts);
                setPage(2); // Set page for the next fetch
                setHasMore(initialPosts.length === POST_PAGE_SIZE);
            } catch (error) {
                console.error("Failed to fetch initial posts:", error);
                setHasMore(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [searchParams, sessionStatus, modeParam]); // FIX 2: Added modeParam to dependencies

    // Function for subsequent loads (infinite scroll)
    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            // Calculate mode inside useCallback to ensure it uses latest session status
            const currentMode = modeParam || (sessionStatus === 'authenticated' ? 'following' : 'explore'); // FIX 1: Use sessionStatus
            const res = await fetch(`/api/posts?mode=${currentMode}&page=${page}`);
            const newPosts: PostWithRelations[] = await res.json();
            setPosts(prev => [...prev, ...newPosts]);
            setPage(prev => prev + 1);
            setHasMore(newPosts.length === POST_PAGE_SIZE);
        } catch (error) {
            console.error("Failed to fetch more posts:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, page, modeParam, sessionStatus]); // FIX 3: Removed searchParams, added modeParam, sessionStatus

    const lastPostElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        });
        
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, loadMore]);

    return (
        <main className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Show skeleton only on the very first load */}
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
