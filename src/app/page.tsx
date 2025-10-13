export const revalidate = 0;

import PostList from "@/components/PostList";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPosts } from "@/lib/post-utils";
// Home component will extract mode from the URL and fetch the first page
export default async function Home({
    searchParams,
}: {
    searchParams: { mode?: string };
}) {
    const modeFromParams = searchParams.mode;
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const mode = modeFromParams || (session ? "following" : "explore");

    const initialPosts = await getPosts(mode, currentUserId, 1);

    return (
        <main className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
            <PostList initialPosts={initialPosts} mode={mode} currentUserId={currentUserId} />
        </main>
    );
}
