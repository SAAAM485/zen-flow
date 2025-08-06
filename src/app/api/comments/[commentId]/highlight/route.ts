/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// POST /api/comments/[commentId]/highlight - Highlight a comment
export async function POST(req: NextRequest, context: any) {
    const session = await getServerSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId: commentIdString } = await context.params;
    const commentId = parseInt(commentIdString, 10);
    if (isNaN(commentId)) {
        return NextResponse.json(
            { error: "Invalid comment ID" },
            { status: 400 }
        );
    }
    const userId = session.user.id;

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: { post: true },
        });

        if (!comment) {
            return NextResponse.json(
                { error: "Comment not found" },
                { status: 404 }
            );
        }

        if (comment.post.authorId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { isHighlighted: true },
        });

        return NextResponse.json(updatedComment, { status: 200 });
    } catch (error) {
        console.error("Error highlighting comment:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}

// DELETE /api/comments/[commentId]/highlight - Unhighlight a comment
export async function DELETE(req: NextRequest, context: any) {
    const session = await getServerSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId: commentIdString } = await context.params;
    const commentId = parseInt(commentIdString, 10);
    if (isNaN(commentId)) {
        return NextResponse.json(
            { error: "Invalid comment ID" },
            { status: 400 }
        );
    }
    const userId = session.user.id;

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: { post: true },
        });

        if (!comment) {
            return NextResponse.json(
                { error: "Comment not found" },
                { status: 404 }
            );
        }

        if (comment.post.authorId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { isHighlighted: false },
        });

        return NextResponse.json(updatedComment, { status: 200 });
    } catch (error) {
        console.error("Error unhighlighting comment:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
