"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';

export default function FeedToggle() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'following';

  const followingRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
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
      <Link href="/" passHref className="flex-1 text-center">
        <div ref={followingRef} className={`${baseClasses} ${mode === 'following' ? activeClasses : inactiveClasses}`}>
          Following
        </div>
      </Link>
      <Link href="/?mode=explore" passHref className="flex-1 text-center">
        <div ref={exploreRef} className={`${baseClasses} ${mode === 'explore' ? activeClasses : inactiveClasses}`}>
          Explore
        </div>
      </Link>
    </div>
  );
}
