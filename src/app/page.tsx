import PostList from "@/components/PostList";
import { prisma } from "@/lib/prisma";

async function getPosts() {
  const posts = await prisma.post.findMany({
    include: {
      author: true,
      comments: {
        include: {
          author: true,
          commentLikes: true,
        },
      },
      postLikes: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return posts;
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <main className="max-w-2xl mx-auto p-4">
      <PostList initialPosts={posts} />
    </main>
  );
}
