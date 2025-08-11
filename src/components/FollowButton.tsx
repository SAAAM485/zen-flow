
"use client";

import { useState } from 'react';
import { toast } from 'sonner';

interface FollowButtonProps {
  initialStatus: string | null;
  targetUserId: number;
  incomingRequestId?: number | null;
  onStatusChange: (newStatus: string) => void;
}

export default function FollowButton({ 
  initialStatus, 
  targetUserId, 
  incomingRequestId,
  onStatusChange 
}: FollowButtonProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow-requests`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to send follow request');
      onStatusChange('pending_approval');
      setStatus('pending_approval');
      toast.success('Follow request sent!');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to unfollow');
      onStatusChange('not_following');
      setStatus('not_following');
      toast.success('Unfollowed successfully');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow-requests`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to cancel request');
      onStatusChange('not_following');
      setStatus('not_following');
      toast.success('Follow request cancelled');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!incomingRequestId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/follow-requests/${incomingRequestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });
      if (!res.ok) throw new Error('Failed to accept request');
      onStatusChange('following');
      setStatus('following');
      toast.success('Follow request accepted');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderButton = () => {
    switch (status) {
      case 'following':
        return <button onClick={handleUnfollow} disabled={isLoading} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">Unfollow</button>;
      case 'pending_approval':
        return <button onClick={handleCancelRequest} disabled={isLoading} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">Requested</button>;
      case 'can_accept':
        return <button onClick={handleAcceptRequest} disabled={isLoading} className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600">Accept Request</button>;
      case 'not_following':
        return <button onClick={handleFollow} disabled={isLoading} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600">Follow</button>;
      default:
        return null; // Don't render anything if status is unknown or is_self
    }
  };

  return renderButton();
}
