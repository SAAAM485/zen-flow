import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

interface HighlightContext {
  params: Promise<{
    commentId: string;
  }>;
}

// POST /api/comments/[commentId]/highlight - Highlight a comment
export async function POST(req: NextRequest, context: HighlightContext) {
    const token = await getToken({ req }); // Get token
    if (!token?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = await context.params;
    const commentIdNum = parseInt(commentId, 10);
    if (isNaN(commentIdNum)) {
        return NextResponse.json(
            { error: "Invalid comment ID" },
            { status: 400 }
        );
    }
    const userId = token.id as number; // Use token.id

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentIdNum },
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
            where: { id: commentIdNum },
            data: { isHighlighted: true },
            include: { author: true }, // Include author in the response
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
export async function DELETE(req: NextRequest, context: HighlightContext) {
    const token = await getToken({ req }); // Get token
    if (!token?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = await context.params;
    const commentIdNum = parseInt(commentId, 10);
    if (isNaN(commentIdNum)) {
        return NextResponse.json(
            { error: "Invalid comment ID" },
            { status: 400 }
        );
    }
    const userId = token.id as number; // Use token.id

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentIdNum },
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
            where: { id: commentIdNum },
            data: { isHighlighted: false },
            include: { author: true }, // Include author in the response
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
