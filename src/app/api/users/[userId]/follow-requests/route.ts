
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/users/[userId]/follow-requests - Send a follow request
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId: userIdString } = await params;
  const targetUserId = parseInt(userIdString, 10);
  if (isNaN(targetUserId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  if (currentUserId === targetUserId) {
    return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
  }

  try {
    // Check if a request already exists or if they are already friends
    const existingRequest = await prisma.followRequest.findUnique({
      where: { fromId_toId: { fromId: currentUserId, toId: targetUserId } },
    });

    if (existingRequest) {
      return NextResponse.json({ error: "Follow request already sent" }, { status: 409 }); // 409 Conflict
    }

    const newFollowRequest = await prisma.followRequest.create({
      data: {
        fromId: currentUserId,
        toId: targetUserId,
        status: 'PENDING',
      },
    });

    return NextResponse.json(newFollowRequest, { status: 201 });

  } catch (error) {
    console.error(`Error sending follow request to ${targetUserId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/users/[userId]/follow-requests - Cancel a sent follow request
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId: userIdString } = await params;
  const targetUserId = parseInt(userIdString, 10);
  if (isNaN(targetUserId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    await prisma.followRequest.delete({
      where: {
        fromId_toId: {
          fromId: currentUserId,
          toId: targetUserId,
        },
        // You can only delete requests that are still pending
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    // Prisma throws an error if the record to delete is not found
    console.error(`Error deleting follow request to ${targetUserId}:`, error);
    return NextResponse.json({ error: "Request not found or could not be deleted" }, { status: 404 });
  }
}
