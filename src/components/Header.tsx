"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useContext } from 'react';
import { LoginPromptContext } from '@/context/LoginPromptContext';

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
    <header className="bg-secondary-bg p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary-text hover:text-accent-blue">
          Zen Flow
        </Link>
        <div className="flex items-center space-x-4">
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
