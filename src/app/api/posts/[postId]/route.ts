// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/posts/[postId] - Fetch a single post
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const postId = parseInt(params.postId, 10);
  if (isNaN(postId)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        comments: {
          include: {
            author: true,
            commentLikes: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        postLikes: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);

  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PUT /api/posts/[postId] - Update a post
export async function PUT(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const postId = parseInt(params.postId, 10);

  if (isNaN(postId)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.authorId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: "Text content is required" }, { status: 400 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { text },
    });

    return NextResponse.json(updatedPost);

  } catch (error) {
    console.error(`Error updating post ${postId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/posts/[postId] - Delete a post
export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const postId = parseInt(params.postId, 10);

  if (isNaN(postId)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.authorId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error(`Error deleting post ${postId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}