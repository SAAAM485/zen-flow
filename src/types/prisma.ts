
import { Post, User, Comment, PostLike, CommentLike } from '@prisma/client';

export type CommentWithAuthor = Comment & { 
    author: User, 
    commentLikes: (CommentLike & { user: { id: number } })[] 
};

export type PostWithRelations = Post & {
  author: User;
  comments: (CommentWithAuthor & { commentLikes: (CommentLike & { user: { id: number } })[] })[];
  postLikes: (PostLike & { user: { id: number } })[];
};
