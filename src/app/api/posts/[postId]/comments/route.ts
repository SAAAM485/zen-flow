// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/posts/[postId]/comments - Create a new comment on a post
export async function POST(
  req: NextRequest,
  context: any
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId: postIdString } = await context.params;
  const postId = parseInt(postIdString, 10);
  if (isNaN(postId)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: "Text content is required" }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        text: text,
        authorId: session.user.id,
        postId: postId,
      },
      include: {
        author: true, // Include author details in the response
      },
    });

    return NextResponse.json(newComment, { status: 201 });

  } catch (error) {
    console.error(`Error creating comment for post ${postId}:`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}