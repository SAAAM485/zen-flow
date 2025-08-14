import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ReactionType } from "@prisma/client";

interface ReactionsContext {
  params: Promise<{
    commentId: string;
  }>;
}

// POST /api/comments/[commentId]/reactions - Add or update a reaction to a comment
export async function POST(
    req: NextRequest,
    context: ReactionsContext
) {
    const session = await getServerSession();
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

    const { commentId } = await context.params;
    const commentIdNum = parseInt(commentId, 10);
    if (isNaN(commentIdNum)) {
        return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }
    const userId = session.user.id;

    try {
        const newReaction = await prisma.commentLike.upsert({
            where: {
                userId_commentId: {
                    userId,
                    commentId: commentIdNum,
                },
            },
            update: {
                type: type as ReactionType,
            },
            create: {
                userId,
                commentId: commentIdNum,
                type: type as ReactionType,
            },
        });
        return NextResponse.json(newReaction, { status: 200 });
    } catch (error) {
        console.error("Error upserting comment reaction:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}

// DELETE /api/comments/[commentId]/reactions - Remove a reaction from a comment
export async function DELETE(
    req: NextRequest,
    context: ReactionsContext
) {
    const session = await getServerSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = await context.params;
    const commentIdNum = parseInt(commentId, 10);
    if (isNaN(commentIdNum)) {
        return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }
    const userId = session.user.id;

    try {
        await prisma.commentLike.delete({
            where: {
                userId_commentId: {
                    userId,
                    commentId: commentIdNum,
                },
            },
        });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error deleting comment reaction:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}