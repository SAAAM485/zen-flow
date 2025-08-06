"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import LoginPrompt from './LoginPrompt';

export default function Header() {
  const { data: session } = useSession();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      setShowLoginPrompt(true);
    }
  };

  return (
    <header className="bg-secondary-bg p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary-text hover:text-accent-blue">
          Zen Flow
        </Link>
        <div className="flex items-center space-x-4">
          {session && session.user && !session.user.name?.startsWith('Guest-') ? (
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
      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
    </header>
  );
}
