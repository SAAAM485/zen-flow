import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface CommentContext {
  params: Promise<{
    commentId: string;
  }>;
}

// PUT /api/comments/[commentId] - Update a comment
export async function PUT(
  req: NextRequest,
  context: CommentContext
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const { commentId } = await context.params;
  const commentIdNum = parseInt(commentId, 10);

  if (isNaN(commentIdNum)) {
    return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
  }

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentIdNum } });
    if (!comment || comment.authorId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: "Text content is required" }, { status: 400 });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentIdNum },
      data: { text },
      include: { author: true }, // Include author in the response
    });

    return NextResponse.json(updatedComment);

  } catch (error) {
    console.error(`Error updating comment ${commentIdNum}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/comments/[commentId] - Delete a comment
export async function DELETE(
  req: NextRequest,
  context: CommentContext
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const { commentId } = await context.params;
  const commentIdNum = parseInt(commentId, 10);

  if (isNaN(commentIdNum)) {
    return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
  }

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comment = await prisma.comment.findUnique({ 
      where: { id: commentIdNum },
      include: { post: true },
    });

    // User can delete if they are the comment author OR the post author
    if (!comment || (comment.authorId !== currentUserId && comment.post.authorId !== currentUserId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentIdNum } });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error(`Error deleting comment ${commentIdNum}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}