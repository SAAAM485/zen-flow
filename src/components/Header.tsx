"use client";

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-secondary-bg p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary-text hover:text-accent-blue">
          Zen Flow
        </Link>
      </nav>
    </header>
  );
}
