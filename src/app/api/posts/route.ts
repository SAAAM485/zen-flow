
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/posts - Fetch all posts for the feed
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode");

  let whereClause = {};

  // If in "following" mode and a user is logged in, filter posts
  if (mode === 'following' && currentUserId) {
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    whereClause = {
      authorId: {
        in: followingIds,
      },
    };
  } else if (mode === 'explore' && currentUserId) {
    // For logged-in users in explore mode, show posts from everyone else
    whereClause = {
      authorId: {
        not: currentUserId,
      },
    };
  }
  // For guests, mode is implicitly 'explore' and currentUserId is null,
  // so whereClause remains {} and all posts are fetched.

  try {
    const posts = await prisma.post.findMany({
      where: whereClause,
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
    const { text, imageUrls } = body;

    // Validate input: must have text or at least one image URL
    if ((!text || typeof text !== 'string' || text.trim().length === 0) && (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0)) {
      return NextResponse.json({ error: "Post content or an image is required" }, { status: 400 });
    }

    const newPost = await prisma.post.create({
      data: {
        text: text || null,
        imageUrls: imageUrls || [],
        authorId: session.user.id,
      },
      include: { // Ensure the returned post has the same shape as feed posts
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

    return NextResponse.json(newPost, { status: 201 }); // 201 Created

  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
