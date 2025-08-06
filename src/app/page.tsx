import { prisma } from '@/lib/prisma';
import PostList from '@/components/PostList';

async function getPosts() {
  const posts = await prisma.post.findMany({
    include: {
      author: true,
      comments: {
        include: {
          author: true,
          commentLikes: {
            include: {
              user: {
                select: { id: true },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      postLikes: {
        include: {
          user: {
            select: { id: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return posts;
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Zen Flow</h1>
      <PostList initialPosts={posts} />
    </div>
  );
}