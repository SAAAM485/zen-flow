"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useContext, useState } from 'react';
import FollowRequestNotification from '@/components/FollowRequestNotification'; // Import FollowRequestNotification
import { LoginPromptContext } from '@/context/LoginPromptContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'; // Add this line
import FeedToggle from './FeedToggle';

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
              <button onClick={(e) => { handleProfileClick(e); setIsMenuOpen(false); }} className="text-primary-text hover:text-accent-blue text-lg">
                Profile
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}