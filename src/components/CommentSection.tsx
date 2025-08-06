
"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { PostWithRelations, CommentWithAuthor } from '@/types/prisma';
import { toast } from 'sonner';
import ConfirmModal from './ConfirmModal';

interface CommentSectionProps {
  post: PostWithRelations;
  onCommentCreated: (postId: number, newComment: CommentWithAuthor) => void;
  onCommentUpdated: (postId: number, updatedComment: CommentWithAuthor) => void;
  onCommentDeleted: (postId: number, commentId: number) => void;
  setShowLoginPrompt: (show: boolean) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ post, onCommentCreated, onCommentUpdated, onCommentDeleted, setShowLoginPrompt }) => {
  const { data: session } = useSession();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const currentUser = session?.user;

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !session) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Failed to create comment');
      const newComment = await res.json();
      onCommentCreated(post.id, newComment);
      setText('');
      toast.success('Comment added!');
    } catch (error) {
      console.error(error);
      toast.error('Error creating comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (commentId: number) => {
    setCommentToDelete(commentId);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setCommentToDelete(null);
    setIsModalOpen(false);
  };

  const handleDeleteComment = async () => {
    if (commentToDelete === null) return;
    try {
      const res = await fetch(`/api/comments/${commentToDelete}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete comment');
      onCommentDeleted(post.id, commentToDelete);
      toast.success('Comment deleted!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Error deleting comment');
    } finally {
      closeDeleteModal();
    }
  };

  const handleEditCommentClick = (comment: CommentWithAuthor) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  const handleSaveCommentEdit = async (commentId: number) => {
    if (!editCommentText.trim()) {
      toast.error('Comment content cannot be empty.');
      return;
    }
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editCommentText }),
      });
      if (!res.ok) throw new Error('Failed to update comment');
      const updatedComment = await res.json();
      onCommentUpdated(post.id, updatedComment);
      setEditingCommentId(null);
      setEditCommentText('');
      toast.success('Comment updated!');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Error updating comment');
    }
  };

  const handleCancelCommentEdit = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  return (
    <div className="mt-4 pt-4 border-t border-border-line">
      <h3 className="font-semibold mb-2">Comments</h3>
      {post.comments.map(comment => (
        <div key={comment.id} className={`ml-4 p-3 rounded-lg ${comment.isHighlighted ? 'bg-secondary-bg' : 'bg-secondary-bg'} mb-2`}>
          <div className="flex items-start">
            <Link href={`/profile/${comment.author.id}`} className="flex items-center mr-3">
              <Image src={comment.author.image ?? '/default-avatar.png'} alt={comment.author.name ?? 'User'} width={32} height={32} className="w-8 h-8 rounded-full" />
            </Link>
            <div className="flex-1">
              {editingCommentId === comment.id ? (
                <div className="mb-2">
                  <textarea
                    value={editCommentText}
                    onChange={(e) => setEditCommentText(e.target.value)}
                    className="w-full p-2 border border-border-line rounded-md focus:outline-none focus:ring-2 focus:ring-primary-text"
                    rows={2}
                  />
                  <div className="text-right mt-1">
                    <button
                      onClick={() => handleSaveCommentEdit(comment.id)}
                      className="bg-secondary-text text-secondary-bg py-1 px-2 rounded-md hover:bg-primary-text mr-1 text-xs"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelCommentEdit}
                      className="bg-border-line text-primary-text py-1 px-2 rounded-md hover:bg-secondary-text text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p><Link href={`/profile/${comment.author.id}`} className="font-semibold hover:underline">{comment.author.name}</Link>: {comment.text}</p>
              )}
              <div className="flex items-center space-x-2 mt-1 text-sm">
                {(currentUser?.id === comment.authorId || currentUser?.id === post.authorId) && (
                  <>
                    {currentUser?.id === comment.authorId && (
                      <button
                        onClick={() => handleEditCommentClick(comment)}
                        className="text-secondary-text hover:text-primary-text text-xs"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteModal(comment.id)}
                      className="text-secondary-text hover:text-primary-text text-xs"
                    >
                      Delete
                    </button>
                  </>
                )}
                {/* TODO: Add comment reaction buttons here */}
              </div>
            </div>
          </div>
        </div>
      ))}
      {session ? (
        <form onSubmit={handleCommentSubmit} className="mt-2 ml-4">
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment..." className="w-full p-2 border border-border-line rounded-md" />
          <div className="text-right mt-1">
            <button type="submit" disabled={isSubmitting || !text.trim()} className="text-sm bg-secondary-text text-secondary-bg py-1 px-3 rounded-md hover:bg-primary-text disabled:bg-border-line">
              {isSubmitting ? 'Replying...' : 'Reply'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-2 ml-4">
          <button
            onClick={() => setShowLoginPrompt(true)}
            className="w-full p-2 border border-border-line rounded-md text-left text-secondary-text hover:bg-primary-text"
          >
            Write a comment...
          </button>
        </div>
      )}
      <ConfirmModal 
        isOpen={isModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteComment}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
      />
    </div>
  );
}

export default CommentSection;
