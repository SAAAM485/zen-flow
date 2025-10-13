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
  ];

  const mockHandlers = {
    onPostUpdate: jest.fn(),
    onPostDeleted: jest.fn(),
    onPostCreated: jest.fn(),
    lastPostRef: jest.fn(),
  };

  it('should render a list of posts', () => {
    render(
      <PostList 
        posts={mockPosts} 
        isLoading={false} 
        hasMore={true} 
        {...mockHandlers} 
      />
    );

    expect(screen.getByTestId('post-card-1')).toBeInTheDocument();
    expect(screen.getByText('First post')).toBeInTheDocument();
    expect(screen.getByTestId('create-post-form')).toBeInTheDocument();
  });

  it('should render loading indicator when isLoading is true', () => {
    render(
      <PostList 
        posts={mockPosts} 
        isLoading={true} 
        hasMore={true} 
        {...mockHandlers} 
      />
    );
    expect(screen.getByText('Loading more posts...')).toBeInTheDocument();
  });

  it("should render end of list message when hasMore is false", () => {
    render(
      <PostList 
        posts={mockPosts} 
        isLoading={false} 
        hasMore={false} 
        {...mockHandlers} 
      />
    );
    expect(screen.getByText("You've reached the end.")).toBeInTheDocument();
  });

  it('should render no posts message when there are no posts', () => {
    render(
      <PostList 
        posts={[]}
        isLoading={false} 
        hasMore={false} 
        {...mockHandlers} 
      />
    );
    expect(screen.getByText('No posts to show.')).toBeInTheDocument();
  });
});