
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// DELETE /api/users/[userId]/follow - Unfollow a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId: userIdString } = params;
  const targetUserId = parseInt(userIdString, 10);
  if (isNaN(targetUserId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  if (currentUserId === targetUserId) {
    return NextResponse.json({ error: "You cannot unfollow yourself" }, { status: 400 });
  }

  try {
    // In a transaction, delete the follow relationship in both directions
    await prisma.$transaction([
      prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      }),
      prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: targetUserId,
            followingId: currentUserId,
          },
        },
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Prisma throws an error if a record to delete is not found.
    // This is okay, it means they weren't following them anyway.
    console.error(`Error unfollowing user ${targetUserId}:`, error);
    return NextResponse.json({ error: "Could not unfollow user" }, { status: 500 });
  }
}
