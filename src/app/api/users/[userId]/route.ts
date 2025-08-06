
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/users/[userId] - Fetch a user's public profile
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = await params;
  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsedUserId },
      select: { // Explicitly select only public fields
        id: true,
        name: true,
        image: true,
        createdAt: true,
        _count: { // Optionally count followers/following for display
          select: { 
            followers: true, 
            following: true 
          }
        },
        posts: {
          include: {
            author: true,
            postLikes: true,
            comments: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

// PUT /api/users/[userId] - Update a user's profile
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const { userId: targetUserIdString } = await params;
  const targetUserId = parseInt(targetUserIdString, 10);

  if (isNaN(targetUserId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  if (!currentUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Authorization check: User can only update their own profile
  if (currentUserId !== targetUserId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, image } = body;

    // Basic validation
    if (typeof name !== 'string' || name.length < 1) {
        return NextResponse.json({ message: "Invalid name" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        name: name,
        image: image, // Assuming image is a URL string
      },
      select: { // Return the updated public data
        id: true,
        name: true,
        image: true,
      }
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error(`Error updating user ${targetUserId}:`, error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
