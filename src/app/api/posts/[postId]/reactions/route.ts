import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ReactionType } from "@prisma/client";
import { authOptions } from "@/lib/auth";

interface ReactionsContext {
  params: {
    postId: string;
  };
}

// POST /api/posts/[postId]/reactions - Add or update a reaction to a post
export async function POST(
    req: NextRequest,
    context: ReactionsContext
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await req.json();
    if (!type || !Object.values(ReactionType).includes(type as ReactionType)) {
        return NextResponse.json(
            { error: "Invalid reaction type" },
            { status: 400 }
        );
    }

    const { postId: postIdString } = context.params;
    const postId = parseInt(postIdString, 10);
    if (isNaN(postId)) {
        return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }
    const userId = session.user.id;

    try {
        const newReaction = await prisma.postLike.upsert({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
            update: {
                type: type as ReactionType,
            },
            create: {
                userId,
                postId,
                type: type as ReactionType,
            },
        });
        return NextResponse.json(newReaction, { status: 200 });
    } catch (error) {
        console.error("Error upserting post reaction:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}

// DELETE /api/posts/[postId]/reactions - Remove a reaction from a post
export async function DELETE(
    req: NextRequest,
    context: ReactionsContext
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId: postIdString } = context.params;
    const postId = parseInt(postIdString, 10);
    if (isNaN(postId)) {
        return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }
    const userId = session.user.id;

    try {
        await prisma.postLike.delete({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error deleting post reaction:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}