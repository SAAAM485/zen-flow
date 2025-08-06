
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/posts - Fetch all posts for the feed
export async function GET(_req: NextRequest) {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
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
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}


// POST /api/posts - Create a new post
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: "Text content is required" }, { status: 400 });
    }

    const newPost = await prisma.post.create({
      data: {
        text: text,
        authorId: session.user.id,
      },
      include: { // Include author details in the response
        author: true,
      },
    });

    return NextResponse.json(newPost, { status: 201 }); // 201 Created

  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
