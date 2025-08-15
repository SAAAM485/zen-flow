
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
    const baseButtonClasses = "inline-flex items-center justify-center font-semibold py-2 px-4 rounded-lg transition-colors duration-200 ease-in-out";

    switch (status) {
      case 'following':
        return <button onClick={handleUnfollow} disabled={isLoading} className={`${baseButtonClasses} bg-secondary-bg text-secondary-text hover:bg-primary-bg`}>Unfollow</button>;
      case 'pending_approval':
        return <button onClick={handleCancelRequest} disabled={isLoading} className={`${baseButtonClasses} bg-secondary-bg text-secondary-text hover:bg-primary-bg`}>Requested</button>;
      case 'can_accept':
        return <button onClick={handleAcceptRequest} disabled={isLoading} className={`${baseButtonClasses} bg-primary-text text-primary-bg hover:bg-secondary-text`}>Accept Request</button>;
      case 'not_following':
        return <button onClick={handleFollow} disabled={isLoading} className={`${baseButtonClasses} bg-primary-text text-primary-bg hover:bg-secondary-text`}>Follow</button>;
      default:
        return null; // Don't render anything if status is unknown or is_self
    }
  };

  return renderButton();
}
