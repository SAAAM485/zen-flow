"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useContext } from 'react';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import FollowRequestNotification from '@/components/FollowRequestNotification'; // Import FollowRequestNotification
import { LoginPromptContext } from '@/context/LoginPromptContext';

// A new component for the toggle
function FeedToggle() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'following'; // Default to following for logged-in users

  const baseClasses = "px-4 py-2 rounded-md text-sm font-medium";
  const activeClasses = "bg-primary-text text-secondary-bg";
  const inactiveClasses = "text-primary-text hover:bg-hover-bg";

  return (
    <div className="flex items-center bg-secondary-bg p-1 rounded-lg">
      <Link href="/" passHref>
        <span className={`${baseClasses} ${mode === 'following' ? activeClasses : inactiveClasses}`}>
          Following
        </span>
      </Link>
      <Link href="/?mode=explore" passHref>
        <span className={`${baseClasses} ${mode === 'explore' ? activeClasses : inactiveClasses}`}>
          Explore
        </span>
      </Link>
    </div>
  );
}

export default function Header() {
  const { data: session } = useSession();
  const { setShowLoginPrompt } = useContext(LoginPromptContext);

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      setShowLoginPrompt(true);
    }
  };

  return (
    <header className="bg-secondary-bg p-4 shadow-md sticky top-0 z-10">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-primary-text hover:text-accent-blue">
          <Image src="/zenlogo.png" alt="Zen Flow Logo" width={32} height={32} />
          <span>Zen Flow</span>
        </Link>
        
        {session?.user && <FeedToggle />}

        <div className="flex items-center space-x-4">
          {session?.user && <FollowRequestNotification />}
          {session?.user ? (
            <>
              <Link href={`/profile/${session.user.id}`} className="text-primary-text hover:text-accent-blue">
                Profile
              </Link>
              <button onClick={() => signOut()} className="text-primary-text hover:text-accent-blue">
                Sign Out
              </button>
            </>
          ) : (
            <button onClick={handleProfileClick} className="text-primary-text hover:text-accent-blue">
              Profile
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
