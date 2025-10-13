import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPosts } from '@/lib/post-utils';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page');
  
  if (!page) {
    return NextResponse.json({ error: 'Missing page parameter' }, { status: 400 });
  }

  const modeParam = searchParams.get('mode');

  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const mode = modeParam || (session ? "following" : "explore");

    const posts = await getPosts(mode, currentUserId, parseInt(page, 10));

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts for API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const currentUserId = session.user.id;

  try {
    const { text, imageUrls } = await req.json();

    if (!text?.trim() && (!imageUrls || imageUrls.length === 0)) {
      return NextResponse.json(
        { error: 'Post content or an image is required' },
        { status: 400 }
      );
    }

    const newPost = await prisma.post.create({
      data: {
        text: text,
        imageUrls: imageUrls,
        authorId: currentUserId,
      },
      include: {
        author: true,
        comments: { include: { author: true, commentLikes: { include: { user: true } } } },
        postLikes: { include: { user: true } },
      },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}