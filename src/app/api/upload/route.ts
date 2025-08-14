
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ message: 'No files found' }, { status: 400 });
  }

  const blobs = [];
  for (const file of files) {
    if (!file.name || !file.stream) {
      continue; // Skip if file is not valid
    }
    const blob = await put(file.name, file.stream(), {
      access: 'public',
      contentType: file.type,
    });
    blobs.push(blob);
  }

  return NextResponse.json({ blobs });
}
