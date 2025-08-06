import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/follow-requests - Fetch pending follow requests for the current user
export async function GET() {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const pendingRequests = await prisma.followRequest.findMany({
            where: {
                toId: currentUserId,
                status: "PENDING",
            },
            include: {
                // Include details of the user who sent the request
                from: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(pendingRequests);
    } catch (error) {
        console.error("Error fetching follow requests:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
