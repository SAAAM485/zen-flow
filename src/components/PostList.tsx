
"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { PostWithRelations, CommentWithAuthor } from '@/types/prisma';
import { ReactionType } from '@prisma/client';
import LoginPrompt from '@/components/LoginPrompt';
import CreatePostForm from '@/components/CreatePostForm';
import CommentSection from '@/components/CommentSection';
import ConfirmModal from './ConfirmModal'; // Import the modal
import { toast } from 'sonner'; // Import toast

interface PostListProps {
  initialPosts: PostWithRelations[];
}

export default function PostList({ initialPosts }: PostListProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<PostWithRelations[]>(initialPosts);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const currentUser = session?.user;

  const handlePostCreated = (newPost: PostWithRelations) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
    toast.success('Post created successfully!');
  };

  const handleCommentCreated = (postId: number, newComment: CommentWithAuthor) => {
    const commentWithLikes = { ...newComment, commentLikes: [] };
    setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, commentWithLikes] } : p));
  };

  const handleCommentUpdated = (postId: number, updatedComment: CommentWithAuthor) => {
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
      ...p,
      comments: p.comments.map(c => c.id === updatedComment.id ? updatedComment : c)
    } : p));
  };

  const handleCommentDeleted = (postId: number, commentId: number) => {
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {
      ...p,
      comments: p.comments.filter(c => c.id !== commentId)
    } : p));
  };

  const handleReaction = async () => {
    if (!session) {
      setShowLoginPrompt(true);
      return;
    }
    console.log("Reaction clicked");
  };

  const openDeleteModal = (postId: number) => {
    setPostToDelete(postId);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setPostToDelete(null);
    setIsModalOpen(false);
  };

  const handleDeletePost = async () => {
    if (postToDelete === null) return;

    try {
      const res = await fetch(`/api/posts/${postToDelete}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete post');
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete));
      toast.success('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post');
    } finally {
      closeDeleteModal();
    }
  };

  const handleEditClick = (post: PostWithRelations) => {
    setEditingPostId(post.id);
    setEditText(post.text || '');
  };

  const handleSaveEdit = async (postId: number) => {
    if (!editText.trim()) {
      toast.error('Post content cannot be empty.');
      return;
    }
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText }),
      });
      if (!res.ok) throw new Error('Failed to update post');
      const updatedPost = await res.json();
      setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, text: updatedPost.text } : p));
      setEditingPostId(null);
      setEditText('');
      toast.success('Post updated successfully!');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Error updating post');
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditText('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <CreatePostForm onPostCreated={handlePostCreated} />
      {posts.map((post) => (
        <div key={post.id} className="bg-secondary-bg shadow-md rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Link href={`/profile/${post.author.id}`} className="flex items-center">
              <Image src={post.author.image ?? "/default-avatar.png"} alt={post.author.name ?? "User Avatar"} width={40} height={40} className="w-10 h-10 rounded-full mr-4" />
              <div>
                <p className="font-semibold hover:underline">{post.author.name}</p>
                <p className="text-sm text-secondary-text">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
            </Link>
            {currentUser?.id === post.authorId && (
              <div className="ml-auto flex space-x-2">
                <button
                  onClick={() => handleEditClick(post)}
                  className="text-secondary-text hover:text-primary-text text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => openDeleteModal(post.id)} // Use the modal
                  className="text-secondary-text hover:text-primary-text text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          {editingPostId === post.id ? (
            <div className="mb-4">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 border border-border-line rounded-md focus:outline-none focus:ring-2 focus:ring-primary-text"
                rows={3}
              />
              <div className="text-right mt-2">
                <button
                  onClick={() => handleSaveEdit(post.id)}
                  className="bg-secondary-text text-secondary-bg py-1 px-3 rounded-md hover:bg-primary-text mr-2"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="bg-border-line text-primary-text py-1 px-3 rounded-md hover:bg-secondary-text"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {post.text && <p className="text-primary-text mb-4">{post.text}</p>}
              {post.imageUrl && (
                <div className="mb-4">
                  <Image src={post.imageUrl} alt="Post image" width={500} height={300} className="rounded-md object-cover w-full" />
                </div>
              )}
            </>
          )}
          <div className="flex items-center space-x-4 mb-4">
            {Object.values(ReactionType).map((type) => (
              <button key={type} onClick={handleReaction} className="px-3 py-1 rounded-full border border-border-line bg-secondary-bg text-primary-text hover:bg-primary-text hover:text-secondary-bg">
                {type} ({post.postLikes.filter(like => like.type === type).length})
              </button>
            ))}
          </div>
          <CommentSection 
            post={post} 
            onCommentCreated={handleCommentCreated} 
            onCommentUpdated={handleCommentUpdated} 
            onCommentDeleted={handleCommentDeleted} 
            setShowLoginPrompt={setShowLoginPrompt} 
          />
        </div>
      ))}
      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
      <ConfirmModal 
        isOpen={isModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeletePost}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
      />
    </div>
  );
}
