"use client";

import { useState, useEffect, useContext, use } from 'react';
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { PostWithRelations, CommentWithAuthor } from "@/types/prisma";
import { ReactionType } from "@prisma/client";
import CommentSection from "@/components/CommentSection";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "sonner";
import { LoginPromptContext } from "@/context/LoginPromptContext";

export default function SinglePostPage({
    params,
}: {
    params: { postId: string };
}) {
    const { postId } = use(params);
    const { data: session } = useSession();
    const { setShowLoginPrompt } = useContext(LoginPromptContext);
    const [post, setPost] = useState<PostWithRelations | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<number | null>(null);
    const currentUser = session?.user;

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/posts/${postId}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch post");
                }
                const data: PostWithRelations = await res.json();
                setPost(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("An unknown error occurred");
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (postId) {
            fetchPost();
        }
    }, [postId]);

    const handleCommentCreated = (
        newPostId: number,
        newComment: CommentWithAuthor
    ) => {
        if (post && newPostId === post.id) {
            const commentWithLikes = { ...newComment, commentLikes: [] };
            setPost((prevPost) =>
                prevPost
                    ? {
                          ...prevPost,
                          comments: [...prevPost.comments, commentWithLikes],
                      }
                    : null
            );
        }
    };

    const handleCommentUpdated = (
        updatedPostId: number,
        updatedComment: CommentWithAuthor
    ) => {
        if (post && updatedPostId === post.id) {
            setPost((prevPost) =>
                prevPost
                    ? {
                          ...prevPost,
                          comments: prevPost.comments.map((c) =>
                              c.id === updatedComment.id ? updatedComment : c
                          ),
                      }
                    : null
            );
        }
    };

    const handleCommentDeleted = (deletedPostId: number, commentId: number) => {
        if (post && deletedPostId === post.id) {
            setPost((prevPost) =>
                prevPost
                    ? {
                          ...prevPost,
                          comments: prevPost.comments.filter(
                              (c) => c.id !== commentId
                          ),
                      }
                    : null
            );
        }
    };

    const handleReaction = async () => {
        if (!session) {
            setShowLoginPrompt(true);
            return;
        }
        console.log("Reaction clicked");
    };

    const openDeleteModal = (id: number) => {
        setPostToDelete(id);
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
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete post");
            toast.success("Post deleted successfully!");
            // Redirect to home or previous page after deletion
            window.location.href = "/";
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Error deleting post");
        } finally {
            closeDeleteModal();
        }
    };

    const handleEditClick = (currentPost: PostWithRelations) => {
        setEditingPostId(currentPost.id);
        setEditText(currentPost.text || "");
    };

    const handleSaveEdit = async (id: number) => {
        if (!editText.trim()) {
            toast.error("Post content cannot be empty.");
            return;
        }
        try {
            const res = await fetch(`/api/posts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: editText, imageUrls: post.imageUrls }),
            });
            if (!res.ok) throw new Error("Failed to update post");
            const updatedPost = await res.json();
            setPost((prevPost) =>
                prevPost ? { ...prevPost, text: updatedPost.text } : null
            );
            setEditingPostId(null);
            setEditText("");
            toast.success("Post updated successfully!");
        } catch (error) {
            console.error("Error updating post:", error);
            toast.error("Error updating post");
        }
    };

    const handleCancelEdit = () => {
        setEditingPostId(null);
        setEditText("");
    };

    if (isLoading) {
        return <div className="text-center p-10">Loading post...</div>;
    }

    if (error) {
        return (
            <div className="text-center p-10 text-red-500">Error: {error}</div>
        );
    }

    if (!post) {
        return <div className="text-center p-10">Post not found.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="bg-secondary-bg shadow-md rounded-lg p-6 mb-6">
                <div className="flex items-center mb-4">
                    <Link
                        href={`/profile/${post.author.id}`}
                        className="flex items-center"
                    >
                        <Image
                            src={post.author.image ?? "/default-avatar.png"}
                            alt={post.author.name ?? "User Avatar"}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full mr-4"
                        />
                        <div>
                            <p className="font-semibold hover:underline">
                                {post.author.name}
                            </p>
                            <p className="text-sm text-secondary-text">
                                {new Date(post.createdAt).toLocaleString()}
                            </p>
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
                                onClick={() => openDeleteModal(post.id)}
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
                        {post.text && (
                            <p className="text-primary-text mb-4">
                                {post.text}
                            </p>
                        )}
                        {post.imageUrls && post.imageUrls.length > 0 && (
                            <div className="mb-4">
                                <div className={`grid gap-2 ${post.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {post.imageUrls.map((url, index) => (
                                        <div key={index} className="relative aspect-video bg-secondary-bg">
                                            <Image
                                                src={url}
                                                alt={`Post image ${index + 1}`}
                                                fill
                                                className="object-contain md:rounded-md"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div className="flex items-center space-x-4 mb-4">
                    {Object.values(ReactionType).map((type) => (
                        <button
                            key={type}
                            onClick={handleReaction}
                            className="px-3 py-1 rounded-full border border-border-line bg-secondary-bg text-primary-text hover:bg-primary-text hover:text-secondary-bg"
                        >
                            {type} (
                            {
                                post.postLikes.filter(
                                    (like) => like.type === type
                                ).length
                            }
                            )
                        </button>
                    ))}
                </div>
                <CommentSection
                    post={post}
                    onCommentCreated={handleCommentCreated}
                    onCommentUpdated={handleCommentUpdated}
                    onCommentDeleted={handleCommentDeleted}
                />
            </div>
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
