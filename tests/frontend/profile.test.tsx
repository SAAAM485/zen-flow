/** @jest-environment jsdom */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import ProfileView from '@/components/ProfileView';
import { UserProfile } from '@/types/prisma';

// Mock next-auth
jest.mock('next-auth/react');
const useSessionMock = useSession as jest.Mock;

// Mock fetch
global.fetch = jest.fn();

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockProfileUser: UserProfile = {
  id: 2,
  name: 'Jane Doe',
  email: 'jane@example.com',
  emailVerified: null,
  password: null,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { followers: 10, following: 5 },
  posts: [],
};

describe('ProfileView Follow Functionality', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    useSessionMock.mockClear();
  });

  test('shows Follow button for a logged-in user viewing another profile', async () => {
    // Arrange
    useSessionMock.mockReturnValue({ data: { user: { id: 1 } }, status: 'authenticated' });

    // Act
    render(
      <ProfileView 
        initialProfile={mockProfileUser}
        initialFollowStatus="not_following"
        initialIncomingRequestId={null}
        targetUserId={2}
      />
    );

    // Assert
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  test('shows Unfollow button when user is already following', async () => {
    // Arrange
    useSessionMock.mockReturnValue({ data: { user: { id: 1 } }, status: 'authenticated' });

    // Act
    render(
      <ProfileView 
        initialProfile={mockProfileUser}
        initialFollowStatus="following"
        initialIncomingRequestId={null}
        targetUserId={2}
      />
    );

    // Assert
    expect(screen.getByText('Unfollow')).toBeInTheDocument();
  });

  test('clicking Follow sends a request and updates button to Requested', async () => {
    // Arrange
    useSessionMock.mockReturnValue({ data: { user: { id: 1 } }, status: 'authenticated' });
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    // Act
    render(
      <ProfileView 
        initialProfile={mockProfileUser}
        initialFollowStatus="not_following"
        initialIncomingRequestId={null}
        targetUserId={2}
      />
    );
    const followButton = screen.getByText('Follow');
    await userEvent.click(followButton);

    // Assert
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/users/2/follow-requests', { method: 'POST' });
    });
    expect(screen.getByText('Requested')).toBeInTheDocument();
  });

  test('does not show follow button on own profile', async () => {
    // Arrange
    useSessionMock.mockReturnValue({ data: { user: { id: 2 } }, status: 'authenticated' });

    // Act
    render(
      <ProfileView 
        initialProfile={mockProfileUser}
        initialFollowStatus={null} // Status is not fetched for own profile
        initialIncomingRequestId={null}
        targetUserId={2}
      />
    );

    // Assert
    expect(screen.queryByText('Follow')).not.toBeInTheDocument();
    expect(screen.queryByText('Unfollow')).not.toBeInTheDocument();
  });

  test('clicking Unfollow sends a request and updates button to Follow', async () => {
    // Arrange
    useSessionMock.mockReturnValue({ data: { user: { id: 1 } }, status: 'authenticated' });
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    // Act
    render(
      <ProfileView 
        initialProfile={mockProfileUser}
        initialFollowStatus="following"
        initialIncomingRequestId={null}
        targetUserId={2}
      />
    );
    const unfollowButton = screen.getByText('Unfollow');
    await userEvent.click(unfollowButton);

    // Assert
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/users/2/follow', { method: 'DELETE' });
    });
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  test('clicking Requested cancels the request and updates button to Follow', async () => {
    // Arrange
    useSessionMock.mockReturnValue({ data: { user: { id: 1 } }, status: 'authenticated' });
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    // Act
    render(
      <ProfileView 
        initialProfile={mockProfileUser}
        initialFollowStatus="pending_approval"
        initialIncomingRequestId={null}
        targetUserId={2}
      />
    );
    const requestedButton = screen.getByText('Requested');
    await userEvent.click(requestedButton);

    // Assert
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/users/2/follow-requests', { method: 'DELETE' });
    });
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  test('shows and handles Accept Request button when there is an incoming request', async () => {
    // Arrange
    useSessionMock.mockReturnValue({ data: { user: { id: 1 } }, status: 'authenticated' });
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    // Act
    render(
      <ProfileView 
        initialProfile={mockProfileUser}
        initialFollowStatus="can_accept"
        initialIncomingRequestId={99}
        targetUserId={2}
      />
    );
    const acceptButton = screen.getByText('Accept Request');
    await userEvent.click(acceptButton);

    // Assert
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/follow-requests/99', expect.any(Object));
    });
    expect(screen.getByText('Unfollow')).toBeInTheDocument();
  });
});