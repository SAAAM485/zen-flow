
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/users/[userId]/follow-status - Get the follow status between the current user and the target user
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return NextResponse.json({ status: "not_following" }); // Not logged in, so can't be following
  }

  const { userId } = await context.params;
  const targetUserId = parseInt(userId, 10);

  if (isNaN(targetUserId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  if (currentUserId === targetUserId) {
    return NextResponse.json({ status: "is_self" });
  }

  try {
    // 1. Check if they are already following
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (follow) {
      return NextResponse.json({ status: "following" });
    }

    // 2. Check for a pending request from the current user to the target user
    const sentRequest = await prisma.followRequest.findUnique({
      where: {
        fromId_toId: {
          fromId: currentUserId,
          toId: targetUserId,
        },
        status: "PENDING",
      },
    });

    if (sentRequest) {
      return NextResponse.json({ status: "pending_approval" });
    }

    // 3. Check for a pending request from the target user to the current user
    const receivedRequest = await prisma.followRequest.findUnique({
      where: {
        fromId_toId: {
          fromId: targetUserId,
          toId: currentUserId,
        },
        status: "PENDING",
      },
    });

    if (receivedRequest) {
      return NextResponse.json({ status: "can_accept", requestId: receivedRequest.id });
    }

    // 4. If none of the above, they are not following
    return NextResponse.json({ status: "not_following" });

  } catch (error) {
    console.error(`Error fetching follow status for user ${targetUserId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
