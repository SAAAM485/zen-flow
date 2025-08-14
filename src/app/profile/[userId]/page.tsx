import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/ProfileView";
import { UserProfile } from "@/types/prisma";

async function getProfile(userId: number): Promise<UserProfile | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: { select: { followers: true, following: true } },
                posts: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: true,
                        comments: {
                            include: {
                                author: true,
                                commentLikes: true,
                            }
                        },
                        postLikes: true,
                    },
                },
            },
        });
        return user as UserProfile | null;
    } catch (error) {
        console.error("Failed to fetch profile:", error);
        return null;
    }
}

async function getFollowStatus(currentUserId: number, targetUserId: number) {
    try {
        const follow = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
        });
        if (follow) return { status: "following" };

        const sentRequest = await prisma.followRequest.findUnique({
            where: { fromId_toId: { fromId: currentUserId, toId: targetUserId }, status: "PENDING" },
        });
        if (sentRequest) return { status: "pending_approval" };

        const receivedRequest = await prisma.followRequest.findUnique({
            where: { fromId_toId: { fromId: targetUserId, toId: currentUserId }, status: "PENDING" },
        });
        if (receivedRequest) return { status: "can_accept", requestId: receivedRequest.id };

        return { status: "not_following" };
    } catch (error) {
        console.error("Failed to fetch follow status:", error);
        return { status: null }; // Return null status on error
    }
}

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const targetUserId = parseInt(resolvedParams.userId, 10);

    if (isNaN(targetUserId)) {
        return <div className="text-center p-10">Invalid user ID.</div>;
    }

    const profile = await getProfile(targetUserId);

    let followStatusData = null;
    if (currentUserId && currentUserId !== targetUserId) {
        followStatusData = await getFollowStatus(currentUserId, targetUserId);
    }

    if (!profile) {
        return <div className="text-center p-10">Could not load profile.</div>;
    }

    return (
        <ProfileView 
            initialProfile={profile}
            initialFollowStatus={followStatusData?.status || null}
            initialIncomingRequestId={followStatusData?.requestId || null}
            targetUserId={targetUserId}
        />
    );
}