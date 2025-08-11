/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FollowButton from '@/components/FollowButton';
import { toast } from 'sonner';

// Mock the sonner library
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the global fetch function
global.fetch = jest.fn();

describe('FollowButton', () => {
  const targetUserId = 123;
  let onStatusChangeMock: jest.Mock;

  beforeEach(() => {
    onStatusChangeMock = jest.fn();
    (fetch as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
    (toast.error as jest.Mock).mockClear();
  });

  describe('when status is "not_following"', () => {
    it('renders a "Follow" button and sends a follow request on click', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true } as Response);
      const user = userEvent.setup();
      render(<FollowButton initialStatus="not_following" targetUserId={targetUserId} onStatusChange={onStatusChangeMock} />);

      const button = screen.getByRole('button', { name: /follow/i });
      expect(button).toBeInTheDocument();

      await user.click(button);

      expect(fetch).toHaveBeenCalledWith(`/api/users/${targetUserId}/follow-requests`, { method: 'POST' });
      await waitFor(() => expect(onStatusChangeMock).toHaveBeenCalledWith('pending_approval'));
      await waitFor(() => expect(screen.getByRole('button', { name: /requested/i })).toBeInTheDocument());
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Follow request sent!'));
    });
  });

  describe('when status is "following"', () => {
    it('renders an "Unfollow" button and sends an unfollow request on click', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true } as Response);
      const user = userEvent.setup();
      render(<FollowButton initialStatus="following" targetUserId={targetUserId} onStatusChange={onStatusChangeMock} />);

      const button = screen.getByRole('button', { name: /unfollow/i });
      await user.click(button);

      expect(fetch).toHaveBeenCalledWith(`/api/users/${targetUserId}/follow`, { method: 'DELETE' });
      await waitFor(() => expect(onStatusChangeMock).toHaveBeenCalledWith('not_following'));
      await waitFor(() => expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument());
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Unfollowed successfully'));
    });
  });

  describe('when status is "pending_approval"', () => {
    it('renders a "Requested" button and cancels the request on click', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true } as Response);
      const user = userEvent.setup();
      render(<FollowButton initialStatus="pending_approval" targetUserId={targetUserId} onStatusChange={onStatusChangeMock} />);

      const button = screen.getByRole('button', { name: /requested/i });
      await user.click(button);

      expect(fetch).toHaveBeenCalledWith(`/api/users/${targetUserId}/follow-requests`, { method: 'DELETE' });
      await waitFor(() => expect(onStatusChangeMock).toHaveBeenCalledWith('not_following'));
      await waitFor(() => expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument());
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Follow request cancelled'));
    });
  });

  describe('when status is "can_accept"', () => {
    const incomingRequestId = 456;
    it('renders an "Accept Request" button and accepts the request on click', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true } as Response);
      const user = userEvent.setup();
      render(
        <FollowButton 
          initialStatus="can_accept" 
          targetUserId={targetUserId} 
          incomingRequestId={incomingRequestId}
          onStatusChange={onStatusChangeMock} 
        />
      );

      const button = screen.getByRole('button', { name: /accept request/i });
      await user.click(button);

      expect(fetch).toHaveBeenCalledWith(`/api/follow-requests/${incomingRequestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });
      await waitFor(() => expect(onStatusChangeMock).toHaveBeenCalledWith('following'));
      await waitFor(() => expect(screen.getByRole('button', { name: /unfollow/i })).toBeInTheDocument());
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Follow request accepted'));
    });
  });

  it('shows an error toast if an API call fails', async () => {
    const errorMessage = 'Failed to send follow request';
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    const user = userEvent.setup();
    render(<FollowButton initialStatus="not_following" targetUserId={targetUserId} onStatusChange={onStatusChangeMock} />);

    const button = screen.getByRole('button', { name: /follow/i });
    await user.click(button);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(errorMessage));
    expect(onStatusChangeMock).not.toHaveBeenCalled();
  });
});
