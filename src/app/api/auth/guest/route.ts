import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    // If already logged in, no need to create a guest
    if (session) {
      return NextResponse.json({ message: "Already logged in" }, { status: 200 });
    }

    // Create a new guest user
    const guestUser = await prisma.user.create({
      data: {
        name: `Guest-${Date.now()}`,
        guest: true,
      },
    });

    // For guest mode, we might need to manually create a session or use a custom credential provider
    // For now, we just return the guest user info. The actual session management for guests
    // will need further integration with NextAuth.js or a custom token approach.
    return NextResponse.json({ user: guestUser, message: "Guest user created" }, { status: 200 });
  } catch (error) {
    console.error("Error creating guest user:", error);
    return NextResponse.json({ message: "Error creating guest user" }, { status: 500 });
  }
}
