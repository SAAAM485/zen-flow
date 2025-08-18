export const revalidate = 0;

import PostList from "@/components/PostList";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PostWithRelations } from "@/types/prisma";
import { prisma } from "@/lib/prisma";

// This function now fetches directly from the database
async function getPosts(
    mode: string,
    currentUserId?: string
): Promise<PostWithRelations[]> {
    try {
        const posts = await prisma.post.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                author: true,
                comments: {
                    include: {
                        author: true,
                        commentLikes: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                postLikes: {
                    include: {
                        user: true,
                    },
                },
            },
        });
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
    searchParams: { mode?: string };
}) {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Determine mode using the searchParams prop, which is more reliable
    const mode = searchParams.mode || (session ? "following" : "explore");

    const posts = await getPosts(mode, currentUserId);

    return (
        <main className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
            <PostList initialPosts={posts} showInteractions={false} />
        </main>
    );
}
