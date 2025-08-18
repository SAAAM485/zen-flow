import { render, screen } from '@testing-library/react';
import PostList from '@/components/PostList';
import { PostWithRelations } from '@/types/prisma';

// Mock child components
jest.mock('@/components/UserPostCard', () => ({
  __esModule: true,
  default: ({ post }: { post: PostWithRelations }) => <div data-testid={`post-card-${post.id}`}>{post.text}</div>,
}));

jest.mock('@/components/CreatePostForm', () => ({
    __esModule: true,
    default: () => <div data-testid="create-post-form"></div>,
}));

describe('PostList', () => {
  const mockPosts: PostWithRelations[] = [
    {
      id: 1,
      text: 'First post',
      author: { id: 1, name: 'User 1', email: 'user1@test.com', image: null, createdAt: new Date(), updatedAt: new Date(), emailVerified: null, password: null },
      comments: [],
      postLikes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: 1,
      imageUrls: [],
    },
    {
      id: 2,
      text: 'Second post',
      author: { id: 2, name: 'User 2', email: 'user2@test.com', image: null, createdAt: new Date(), updatedAt: new Date(), emailVerified: null, password: null },
      comments: [],
      postLikes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: 2,
      imageUrls: [],
    },
  ];

  it('should render a list of posts', () => {
    render(<PostList initialPosts={mockPosts} />);

    expect(screen.getByTestId('post-card-1')).toBeInTheDocument();
    expect(screen.getByText('First post')).toBeInTheDocument();
    expect(screen.getByTestId('post-card-2')).toBeInTheDocument();
    expect(screen.getByText('Second post')).toBeInTheDocument();
  });

  it('should render the create post form', () => {
    render(<PostList initialPosts={[]} />);
    expect(screen.getByTestId('create-post-form')).toBeInTheDocument();
  });
});
