export const revalidate = 0;

import PostList from "@/components/PostList";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PostWithRelations } from "@/types/prisma";
import { headers } from "next/headers"; // Import headers

// This function now fetches from the API endpoint
// It receives the mode as a simple string and the cookie header
async function getPosts(
    mode: string,
    cookieHeader?: string
): Promise<PostWithRelations[]> {
    // No need to derive mode here anymore
    // ...
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const apiUrl = new URL(`${baseUrl}/api/posts`);
    apiUrl.searchParams.append("mode", mode);

    try {
        const fetchOptions: RequestInit = {
            cache: "no-store", // Feed should not be cached
            headers: {}, // Initialize headers object
        };

        if (cookieHeader) {
            fetchOptions.headers = {
                ...fetchOptions.headers,
                Cookie: cookieHeader,
            };
        }

        const res = await fetch(apiUrl.toString(), fetchOptions);

        if (!res.ok) {
            console.error(`Failed to fetch posts: ${res.statusText}`);
            return [];
        }
        const posts = await res.json();
        return posts;
    } catch (error) {
        console.error("An error occurred while fetching posts:", error);
        return [];
    }
}

// Home component will extract mode from the URL
export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ mode?: string }>;
}) {
    // Read searchParams at the top to avoid Next.js dynamic API warnings
    const resolvedSearchParams = await searchParams;
    const modeFromParams = resolvedSearchParams.mode;

    const session = await getServerSession(authOptions);
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie");

    // Determine mode using the searchParams prop, which is more reliable
    const mode = modeFromParams || (session ? "following" : "explore");

    const posts = await getPosts(mode, cookieHeader ?? undefined); // Pass the derived mode string

    return (
        <main className="max-w-2xl mx-auto p-4">
            {/* For the homepage feed, we don't show interaction buttons directly on the list */}
            <PostList initialPosts={posts} showInteractions={false} />
        </main>
    );
}
