/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import CommentSection from '@/components/CommentSection';
import { LoginPromptContext } from '@/context/LoginPromptContext';
import { PostWithRelations, CommentWithAuthor } from '@/types/prisma';
import { User } from '@prisma/client';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
interface MockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

jest.mock('@/components/ConfirmModal', () => ({ isOpen, onClose, onConfirm, title, description }: MockModalProps) => {
  if (!isOpen) return null;
  return (
    <div data-testid="confirm-modal">
      <h1>{title}</h1>
      <p>{description}</p>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
});
jest.mock('date-fns', () => ({ formatDistanceToNow: () => '5 minutes ago' }));

global.fetch = jest.fn();

const useSessionMock = useSession as jest.Mock;
const fetchMock = global.fetch as jest.Mock;

// Mock Data
const postAuthor: User = {
    id: 1, name: 'Post Author', email: 'author@test.com', emailVerified: null, password: null, image: null, createdAt: new Date(), updatedAt: new Date()
};
const commentAuthor: User = {
    id: 2, name: 'Commenter', email: 'commenter@test.com', emailVerified: null, password: null, image: null, createdAt: new Date(), updatedAt: new Date()
};
const otherUser: User = {
    id: 3, name: 'Other User', email: 'other@test.com', emailVerified: null, password: null, image: null, createdAt: new Date(), updatedAt: new Date()
};

const mockComment: CommentWithAuthor = {
    id: 101, postId: 1, authorId: 2, text: 'This is a comment', isHighlighted: false, createdAt: new Date(),
    author: commentAuthor,
    commentLikes: []
};

const mockPost: PostWithRelations = {
    id: 1, text: 'Post text', imageUrls: [], authorId: 1, createdAt: new Date(), updatedAt: new Date(),
    author: postAuthor,
    comments: [mockComment],
    postLikes: []
};

describe('CommentSection', () => {
    let onCommentCreatedMock: jest.Mock;
    let onCommentUpdatedMock: jest.Mock;
    let onCommentDeletedMock: jest.Mock;
    let setShowLoginPromptMock: jest.Mock;

    beforeEach(() => {
        onCommentCreatedMock = jest.fn();
        onCommentUpdatedMock = jest.fn();
        onCommentDeletedMock = jest.fn();
        setShowLoginPromptMock = jest.fn();
        (toast.success as jest.Mock).mockClear();
        (toast.error as jest.Mock).mockClear();
        fetchMock.mockClear();
    });

    const renderComponent = (currentUser: User | null) => {
        useSessionMock.mockReturnValue({ data: currentUser ? { user: currentUser } : null, status: currentUser ? 'authenticated' : 'unauthenticated' });
        return render(
            <LoginPromptContext.Provider value={{ showLoginPrompt: false, setShowLoginPrompt: setShowLoginPromptMock }}>
                <CommentSection 
                    post={mockPost} 
                    onCommentCreated={onCommentCreatedMock}
                    onCommentUpdated={onCommentUpdatedMock}
                    onCommentDeleted={onCommentDeletedMock}
                />
            </LoginPromptContext.Provider>
        );
    }

    it('renders comments correctly', () => {
        renderComponent(otherUser);
        expect(screen.getByText('Commenter')).toBeInTheDocument();
        expect(screen.getByText('This is a comment')).toBeInTheDocument();
    });

    it('allows a logged-in user to post a comment', async () => {
        const user = userEvent.setup();
        renderComponent(otherUser);

        const newCommentText = 'This is a new reply!';
        const newComment = { ...mockComment, id: 102, text: newCommentText };
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => newComment });

        await user.type(screen.getByPlaceholderText('Write a comment...'), newCommentText);
        await user.click(screen.getByRole('button', { name: 'Reply' }));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(`/api/posts/1/comments`, expect.any(Object));
            expect(onCommentCreatedMock).toHaveBeenCalledWith(1, newComment);
            expect(toast.success).toHaveBeenCalledWith('Comment added!');
        });
        expect(screen.getByPlaceholderText('Write a comment...')).toHaveValue('');
    });

    it('allows the comment author to delete their comment', async () => {
        const user = userEvent.setup();
        renderComponent(commentAuthor);

        fetchMock.mockResolvedValueOnce({ ok: true });

        await user.click(screen.getByRole('button', { name: 'Delete' }));
        
        // Modal should be visible now
        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Confirm' }));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(`/api/comments/101`, { method: 'DELETE' });
            expect(onCommentDeletedMock).toHaveBeenCalledWith(1, 101);
        });
    });

    it('allows the post author to highlight a comment', async () => {
        const user = userEvent.setup();
        renderComponent(postAuthor);

        const highlightedComment = { ...mockComment, isHighlighted: true };
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => highlightedComment });

        await user.click(screen.getByRole('button', { name: 'Highlight' }));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(`/api/comments/101/highlight`, { method: 'POST' });
            expect(onCommentUpdatedMock).toHaveBeenCalledWith(1, highlightedComment);
            expect(toast.success).toHaveBeenCalledWith('Comment highlighted!');
        });
    });

    it('does not show edit/delete to other users', () => {
        renderComponent(otherUser);
        expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Highlight' })).not.toBeInTheDocument();
    });
});
