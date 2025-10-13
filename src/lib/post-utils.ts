import { prisma } from "@/lib/prisma";
import { PostWithRelations } from "@/types/prisma";
import { Prisma } from "@prisma/client";

const POST_PAGE_SIZE = 10;

// This function now fetches with pagination and full includes for the paginated items.
export async function getPosts(
    mode: string,
    currentUserId: number | undefined,
    page: number = 1
): Promise<PostWithRelations[]> {
    let whereClause: Prisma.PostWhereInput = {};

    if (mode === 'following' && currentUserId) {
        const following = await prisma.follow.findMany({
            where: { followerId: currentUserId },
            select: { followingId: true },
        });
        const followingIds = following.map((f) => f.followingId);
        whereClause.authorId = { in: followingIds };
    } else if (mode === 'explore' && currentUserId) {
        whereClause.authorId = { not: currentUserId };
    }
    
    try {
        const posts = await prisma.post.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
            take: POST_PAGE_SIZE,
            skip: (page - 1) * POST_PAGE_SIZE,
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
        return posts as PostWithRelations[];
    } catch (error) {
        console.error("An error occurred while fetching posts:", error);
        return [];
    }
}
