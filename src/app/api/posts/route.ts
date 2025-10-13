import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPosts } from '@/app/page'; // Import the function from page.tsx

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');
  const mode = searchParams.get('mode');

  if (!page || !mode) {
    return NextResponse.json({ error: 'Missing page or mode parameter' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const posts = await getPosts(mode, currentUserId, parseInt(page, 10));

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts for API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}