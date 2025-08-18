import { render, screen, fireEvent } from '@testing-library/react';
import UserPostCard from '@/components/UserPostCard';
import { PostWithRelations } from '@/types/prisma';
import { useSession } from 'next-auth/react';
import { LoginPromptContext } from '@/context/LoginPromptContext';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('swiper/react', () => ({
  Swiper: ({ children }: { children: React.ReactNode }) => <div data-testid="swiper">{children}</div>,
  SwiperSlide: ({ children }: { children: React.ReactNode }) => <div data-testid="swiper-slide">{children}</div>,
}));

const mockUseSession = useSession as jest.Mock;

describe('UserPostCard', () => {
  const mockPost: PostWithRelations = {
    id: 1,
    text: 'Test post',
    author: { id: 1, name: 'Test User', email: 'test@test.com', image: '', createdAt: new Date(), updatedAt: new Date(), emailVerified: null, password: null },
    imageUrls: ['http://example.com/image.jpg'],
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 1,
    comments: [],
    postLikes: [],
  };

  const mockOnPostUpdate = jest.fn();
  const mockOnPostDeleted = jest.fn();

  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: { user: { id: 1 } } });
  });

  it('should render the post content', () => {
    render(
      <LoginPromptContext.Provider value={{ showLoginPrompt: false, setShowLoginPrompt: jest.fn() }}>
        <UserPostCard post={mockPost} onPostUpdate={mockOnPostUpdate} onPostDeleted={mockOnPostDeleted} />
      </LoginPromptContext.Provider>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Test post')).toBeInTheDocument();
    expect(screen.getByTestId('swiper')).toBeInTheDocument();
  });

  it('should show delete button for the author', () => {
    render(
        <LoginPromptContext.Provider value={{ showLoginPrompt: false, setShowLoginPrompt: jest.fn() }}>
          <UserPostCard post={mockPost} onPostUpdate={mockOnPostUpdate} onPostDeleted={mockOnPostDeleted} />
        </LoginPromptContext.Provider>
      );
  
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

  it('should not show delete button for other users', () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 2 } } });
    render(
        <LoginPromptContext.Provider value={{ showLoginPrompt: false, setShowLoginPrompt: jest.fn() }}>
          <UserPostCard post={mockPost} onPostUpdate={mockOnPostUpdate} onPostDeleted={mockOnPostDeleted} />
        </LoginPromptContext.Provider>
      );
  
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
});
