import { Suspense } from 'react';
import HomeClient from './HomeClient';
import PostSkeleton from '@/components/PostSkeleton';

// This is the main page component. It's a server component.
export default function Page() {
  // The Suspense boundary is crucial. It tells Next.js to render the fallback
  // first, and then stream in the HomeClient component once it's ready on the client.
  // This avoids the `useSearchParams()` error during server-side prerendering.
  return (
    <Suspense fallback={<SkeletonFallback />}>
      <HomeClient />
    </Suspense>
  );
}

// Define a fallback component to be shown while the client component is loading.
function SkeletonFallback() {
    return (
        <main className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
            <div>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
            </div>
        </main>
    )
}