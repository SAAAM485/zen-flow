// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT /api/comments/[commentId] - Update a comment
export async function PUT(
  req: NextRequest,
  context: any
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const commentId = parseInt(params.commentId, 10);

  if (isNaN(commentId)) {
    return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
  }

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.authorId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: "Text content is required" }, { status: 400 });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { text },
    });

    return NextResponse.json(updatedComment);

  } catch (error) {
    console.error(`Error updating comment ${commentId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/comments/[commentId] - Delete a comment
export async function DELETE(
  req: NextRequest,
  context: any
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const commentId = parseInt(params.commentId, 10);

  if (isNaN(commentId)) {
    return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
  }

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comment = await prisma.comment.findUnique({ 
      where: { id: commentId },
      include: { post: true },
    });

    // User can delete if they are the comment author OR the post author
    if (!comment || (comment.authorId !== currentUserId && comment.post.authorId !== currentUserId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error(`Error deleting comment ${commentId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}