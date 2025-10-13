/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import FollowRequestNotification from '@/components/FollowRequestNotification';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const useSessionMock = useSession as jest.Mock;
global.fetch = jest.fn();

// Define the type based on the actual component
interface FollowRequestWithFromUser {
  id: number;
  fromId: number;
  toId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  from: {
    id: number;
    name: string | null;
    image: string | null;
  };
}

const mockRequests: FollowRequestWithFromUser[] = [
  {
    id: 1,
    fromId: 101,
    toId: 1,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    from: { id: 101, name: 'Alice', image: null },
  },
  {
    id: 2,
    fromId: 102,
    toId: 1,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    from: { id: 102, name: 'Bob', image: null },
  },
];

describe('FollowRequestNotification', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    (toast.error as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
    useSessionMock.mockReturnValue({
      data: { user: { id: 1 } },
      status: 'authenticated',
    });
  });

  it('fetches and displays notifications when there are pending requests', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ 
      ok: true, 
      json: async () => mockRequests 
    } as Response);

    render(<FollowRequestNotification />);
    
    const badge = await screen.findByText(mockRequests.length.toString());
    expect(badge).toBeInTheDocument();

    const notificationButton = screen.getByRole('button', { name: /notifications/i });
    await userEvent.click(notificationButton);

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(await screen.findByText('Bob')).toBeInTheDocument();
  }, 10000);

  it('shows a "no new requests" message when there are no pending requests', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response);

    render(<FollowRequestNotification />);

    const notificationButton = await screen.findByRole('button', { name: /notifications/i });
    await userEvent.click(notificationButton);

    expect(await screen.findByText('No new requests.')).toBeInTheDocument();
  });

  it('handles accepting a request successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockRequests[0]] } as Response);
    render(<FollowRequestNotification />);

    const notificationButton = await screen.findByRole('button', { name: /notifications/i });
    await userEvent.click(notificationButton);

    const acceptButton = await screen.findByRole('button', { name: /accept/i });

    // Mock the PUT request for the action
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true } as Response);
    await userEvent.click(acceptButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/follow-requests/1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Request accepted!');
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });
  });

  it('handles declining a request successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockRequests[0]] } as Response);
    render(<FollowRequestNotification />);

    const notificationButton = await screen.findByRole('button', { name: /notifications/i });
    await userEvent.click(notificationButton);

    const declineButton = await screen.findByRole('button', { name: /decline/i });

    // Mock the PUT request for the action
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true } as Response);
    await userEvent.click(declineButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/follow-requests/1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });
    });

    await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Request rejected!');
    });

    await waitFor(() => {
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });
  });

  it('shows an error toast if fetching initial requests fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false } as Response);
    render(<FollowRequestNotification />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load follow requests');
    });
  });
});
