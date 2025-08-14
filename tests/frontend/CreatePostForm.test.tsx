/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import CreatePostForm from '@/components/CreatePostForm';
import { LoginPromptContext } from '@/context/LoginPromptContext';
import { PostWithRelations } from '@/types/prisma';
import { User } from '@prisma/client';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

global.fetch = jest.fn();

const useSessionMock = useSession as jest.Mock;
const fetchMock = global.fetch as jest.Mock;

const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: null,
    password: null,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockPost: PostWithRelations = {
  id: 1,
  text: 'This is a new post',
  imageUrls: [],
  authorId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  author: mockUser,
  comments: [],
  postLikes: [],
};

describe('CreatePostForm', () => {
  let onPostCreatedMock: jest.Mock;
  let setShowLoginPromptMock: jest.Mock;

  beforeEach(() => {
    onPostCreatedMock = jest.fn();
    setShowLoginPromptMock = jest.fn();
    (toast.success as jest.Mock).mockClear();
    (toast.error as jest.Mock).mockClear();
    fetchMock.mockClear();
    // Mock URL.createObjectURL and URL.revokeObjectURL for image previews
    global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-preview');
    global.URL.revokeObjectURL = jest.fn();
  });

  const renderComponent = () =>
    render(
      <LoginPromptContext.Provider value={{ showLoginPrompt: false, setShowLoginPrompt: setShowLoginPromptMock }}>
        <CreatePostForm onPostCreated={onPostCreatedMock} />
      </LoginPromptContext.Provider>
    );

  describe('when user is not logged in', () => {
    beforeEach(() => {
      useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
    });

    it('should render a readonly textarea', () => {
      renderComponent();
      expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("What's on your mind?")).toHaveAttribute('readonly');
    });

    it('should show login prompt on click', async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.click(screen.getByPlaceholderText("What's on your mind?"));
      expect(setShowLoginPromptMock).toHaveBeenCalledWith(true);
    });
  });

  describe('when user is logged in', () => {
    beforeEach(() => {
      useSessionMock.mockReturnValue({ data: { user: mockUser }, status: 'authenticated' });
    });

    it('should enable post button when text is entered', async () => {
      const user = userEvent.setup();
      renderComponent();
      const postButton = screen.getByRole('button', { name: /post/i });
      expect(postButton).toBeDisabled();

      await user.type(screen.getByPlaceholderText("What's on your mind?"), 'Hello world');
      expect(postButton).toBeEnabled();
    });

    it('should handle image selection and removal', async () => {
        const user = userEvent.setup();
        renderComponent();
        const file = new File(['hello'], 'hello.png', { type: 'image/png' });
        const input = screen.getByTestId('image-upload-input');
        
        await user.upload(input, file);

        const preview = await screen.findByAltText('Image preview 1');
        expect(preview).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /post/i })).toBeEnabled();

        const removeButton = screen.getByLabelText('Remove image 1');
        await user.click(removeButton);

        expect(preview).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /post/i })).toBeDisabled();
    });

    it('should submit the form, create a post, and reset', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.type(screen.getByPlaceholderText("What's on your mind?"), mockPost.text || '');
      
      fetchMock.mockResolvedValueOnce({ 
        ok: true, 
        json: async () => mockPost 
      });

      await user.click(screen.getByRole('button', { name: /post/i }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: mockPost.text, imageUrls: [] }),
        });
      });

      await waitFor(() => {
        expect(onPostCreatedMock).toHaveBeenCalledWith(mockPost);
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Post created successfully!');
      });

      expect(screen.getByPlaceholderText("What's on your mind?")).toHaveValue('');
    });

    it('should handle post creation failure', async () => {
        const user = userEvent.setup();
        renderComponent();
  
        await user.type(screen.getByPlaceholderText("What's on your mind?"), 'test content');
        
        fetchMock.mockResolvedValueOnce({ 
          ok: false, 
        });
  
        await user.click(screen.getByRole('button', { name: /post/i }));
  
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Error creating post');
        });

        expect(onPostCreatedMock).not.toHaveBeenCalled();
      });

      it('should handle image upload and then post creation', async () => {
        const user = userEvent.setup();
        renderComponent();
        const file = new File(['image'], 'image.png', { type: 'image/png' });
        const mockImageUrl = 'https://blob.vercel.com/image.png';

        // Mock upload response
        fetchMock.mockResolvedValueOnce({ 
            ok: true, 
            json: async () => ({ blobs: [{ url: mockImageUrl }] })
        });
        // Mock post creation response
        fetchMock.mockResolvedValueOnce({ 
            ok: true, 
            json: async () => ({ ...mockPost, imageUrls: [mockImageUrl] })
        });

        const input = screen.getByTestId('image-upload-input');
        await user.upload(input, file);
        await user.type(screen.getByPlaceholderText("What's on your mind?"), mockPost.text || '');
        await user.click(screen.getByRole('button', { name: /post/i }));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/upload', expect.any(Object));
        });

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: mockPost.text, imageUrls: [mockImageUrl] }),
            });
        });

        await waitFor(() => {
            expect(onPostCreatedMock).toHaveBeenCalledWith({ ...mockPost, imageUrls: [mockImageUrl] });
        });
      });
  });
});
