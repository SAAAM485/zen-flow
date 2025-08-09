import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FollowRequestStatus } from "@prisma/client";

interface RequestContext {
  params: {
    requestId: string;
  };
}

// PUT /api/follow-requests/[requestId] - Accept or decline a follow request
export async function PUT(
  req: NextRequest,
  context: RequestContext
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId: requestIdString } = context.params;
  const requestId = parseInt(requestIdString, 10);
  if (isNaN(requestId)) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  try {
    const { status } = await req.json();
    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const request = await prisma.followRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.toId !== currentUserId) {
      return NextResponse.json({ error: "Request not found or you are not the recipient" }, { status: 404 });
    }

    if (request.status !== 'PENDING') {
        return NextResponse.json({ error: "Request has already been actioned" }, { status: 409 });
    }

    if (status === 'REJECTED') {
      const updatedRequest = await prisma.followRequest.update({
        where: { id: requestId },
        data: { status: FollowRequestStatus.REJECTED },
      });
      return NextResponse.json(updatedRequest);
    }

    // If ACCEPTED, perform a transaction
    const [, , updatedRequest] = await prisma.$transaction([
      // 1. Create the follow relationship for the follower
      prisma.follow.create({
        data: {
          followerId: request.fromId,
          followingId: currentUserId,
        },
      }),
      // 2. Create the inverse follow relationship for the current user
      prisma.follow.create({
          data: {
              followerId: currentUserId,
              followingId: request.fromId,
          }
      }),
      // 3. Update the request status
      prisma.followRequest.update({
        where: { id: requestId },
        data: { status: FollowRequestStatus.ACCEPTED },
      }),
    ]);

    return NextResponse.json(updatedRequest);

  } catch (error) {
    console.error(`Error updating follow request ${requestId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}