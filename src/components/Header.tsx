"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useContext, useState, useRef, useEffect } from 'react'; // Added useState, useRef, useEffect
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import FollowRequestNotification from '@/components/FollowRequestNotification'; // Import FollowRequestNotification
import { LoginPromptContext } from '@/context/LoginPromptContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'; // Add this line

// A new component for the toggle
function FeedToggle() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'following';

  const followingRef = useRef<HTMLSpanElement>(null);
  const exploreRef = useRef<HTMLSpanElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (mode === 'following' && followingRef.current) {
      setIndicatorStyle({
        left: followingRef.current.offsetLeft,
        width: followingRef.current.offsetWidth,
      });
    } else if (mode === 'explore' && exploreRef.current) {
      setIndicatorStyle({
        left: exploreRef.current.offsetLeft,
        width: exploreRef.current.offsetWidth,
      });
    }
  }, [mode]);

        const baseClasses = "px-4 py-2 rounded-md text-sm font-medium relative z-10 w-24";
  const activeClasses = "text-secondary-bg";
  const inactiveClasses = "text-primary-text hover:bg-hover-bg";

  return (
    <div className="relative flex items-center bg-secondary-bg p-1 rounded-lg">
      <div
        className="absolute bg-primary-text rounded-md h-full transition-all duration-300 ease-in-out"
        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      ></div>
      <Link href="/" passHref className="flex-1 text-center"> {/* Removed px-4 py-2 from Link */}
        <div ref={followingRef} className={`${baseClasses} ${mode === 'following' ? activeClasses : inactiveClasses}`}>
          Following
        </div>
      </Link>
      <Link href="/?mode=explore" passHref className="flex-1 text-center"> {/* Removed px-4 py-2 from Link */}
        <div ref={exploreRef} className={`${baseClasses} ${mode === 'explore' ? activeClasses : inactiveClasses}`}>
          Explore
        </div>
      </Link>
    </div>
  );
}

export default function Header() {
  const { data: session } = useSession();
  const { setShowLoginPrompt } = useContext(LoginPromptContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationListOpen, setIsNotificationListOpen] = useState(false);

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      setShowLoginPrompt(true);
    }
  };

  return (
    <header className="bg-secondary-bg p-2 sm:p-3 md:p-4 shadow-md sticky top-0 z-10">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-1 sm:space-x-2 text-xl sm:text-2xl font-bold text-primary-text hover:text-accent-blue">
          <Image src="/zenlogo.png" alt="Zen Flow Logo" width={32} height={32} />
          <span>Zen Flow</span>
        </Link>
        
        {session?.user && <FeedToggle />}

        {/* Hamburger menu button for mobile */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-primary-text hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-1 sm:space-x-2 md:space-x-4">
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

        {/* Mobile menu overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-secondary-bg z-40 flex flex-col items-center py-4 space-y-4 shadow-lg rounded-b-lg">
            {session?.user && (
              <div className="w-full px-4 flex flex-col items-center">
                <FollowRequestNotification 
                  displayMode="button" 
                  onClick={() => setIsNotificationListOpen(!isNotificationListOpen)}
                />
                {isNotificationListOpen && (
                  <div className="mt-2 w-full">
                    <FollowRequestNotification displayMode="inline" />
                  </div>
                )}
              </div>
            )}
            {session?.user ? (
              <>
                <Link href={`/profile/${session.user.id}`} className="text-primary-text hover:text-accent-blue text-lg" onClick={() => setIsMenuOpen(false)}>
                  Profile
                </Link>
                <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="text-primary-text hover:text-accent-blue text-lg">
                  Sign Out
                </button>
              </>
            ) : (
              <button onClick={() => { handleProfileClick; setIsMenuOpen(false); }} className="text-primary-text hover:text-accent-blue text-lg">
                Profile
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}