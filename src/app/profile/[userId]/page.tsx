
'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';

import Image from 'next/image';
import UserPostCard from '@/components/UserPostCard';
import { PostWithRelations } from '@/types/prisma';

// Define a type for the user profile data
interface UserProfile {
  id: number;
  name: string;
  image: string | null;
  createdAt: string;
  _count: {
    followers: number;
    following: number;
  };
  posts: PostWithRelations[];
}

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const { data: session, status } = useSession();
  const { userId } = use(params);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<PostWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the editable form
  const [name, setName] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data: UserProfile = await res.json();
        setProfile(data);
        setUserPosts(data.posts || []);
        // Initialize form fields if it's the current user's profile
        if (session?.user?.id === userId) {
          setName(data.name || '');
          setImage(data.image || '');
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || session?.user?.id !== userId) return; // Only allow current user to edit their profile

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedProfile: UserProfile = await res.json();
      setProfile(updatedProfile);
      alert('Profile updated successfully!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  if (isLoading || status === 'loading') {
    return <div className="text-center p-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  if (!profile) {
    return <div className="text-center p-10">Could not load profile.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <Image // 使用 Image 組件
            src={profile.image || '/default-avatar.png'}
            alt={profile.name || 'User'}
            width={96} // 設定寬度 (24 * 4 = 96)
            height={96} // 設定高度 (24 * 4 = 96)
            className="w-24 h-24 rounded-full mr-6"
          />
          <div>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <p className="text-gray-500">Joined on {new Date(profile.createdAt).toLocaleDateString()}</p>
            <div className="flex space-x-4 mt-2">
              <span><b>{profile._count.followers}</b> Followers</span>
              <span><b>{profile._count.following}</b> Following</span>
            </div>
          </div>
        </div>
      </div>

      {session?.user?.id === userId && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input 
                type="text" 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image URL</label>
              <input 
                type="text" 
                id="image" 
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">{profile.name}&apos;s Posts</h2>
        {userPosts.length > 0 ? (
          userPosts.map((post) => (
            <UserPostCard key={post.id} post={post} />
          ))
        ) : (
          <p className="text-center text-secondary-text">No posts found.</p>
        )}
      </div>
    </div>
  );
}
