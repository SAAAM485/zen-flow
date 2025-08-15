"use client";

import { useState, useEffect, useContext, use } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { PostWithRelations, CommentWithAuthor } from "@/types/prisma";
import { ReactionType } from "@prisma/client";
import CommentSection from "@/components/CommentSection";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "sonner";
import { LoginPromptContext } from "@/context/LoginPromptContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import ImageModal from "@/components/ImageModal";

const reactionIcons = {
    LIKE: (props) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-1.9 3.8z" />
        </svg>
    ),
    INSIGHTFUL: (props) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.707.707M12 21v-1m-6.364-1.636l.707-.707" />
        </svg>
    ),
    THANKS: (props) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.672l1.318-1.354a4.5 4.5 0 116.364 6.364L12 21.272l-7.682-7.682a4.5 4.5 0 010-6.364z" />
        </svg>
    ),
    HAHA: (props) => (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

export default function SinglePostPage({
    params,
}: {
    params: Promise<{ postId: string }>;
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
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const handleImageClick = (index: number) => {
        setSelectedImageIndex(index);
        setIsImageModalOpen(true);
    };
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
            setPost((prevPost) =>
                prevPost
                    ? {
                          ...prevPost,
                          comments: [...prevPost.comments, newComment],
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
                          comments: prevPost.comments
                              .map((c) =>
                                  c.id === updatedComment.id
                                      ? updatedComment
                                      : c
                              )
                              .sort((a, b) => {
                                  // Sort by isHighlighted (descending) then createdAt (ascending)
                                  if (a.isHighlighted && !b.isHighlighted)
                                      return -1;
                                  if (!a.isHighlighted && b.isHighlighted)
                                      return 1;
                                  return (
                                      new Date(a.createdAt).getTime() -
                                      new Date(b.createdAt).getTime()
                                  );
                              }),
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

    const handleReaction = async (type: ReactionType) => {
        if (!session?.user?.id) {
            setShowLoginPrompt(true);
            return;
        }

        if (!post) return;

        const currentUserReaction = post.postLikes.find(
            (like) => like.userId === session.user.id
        );

        const originalPost = JSON.parse(JSON.stringify(post)); // Deep copy for rollback

        // Optimistic update
        if (currentUserReaction && currentUserReaction.type === type) {
            // User is un-reacting
            setPost((prev) =>
                prev
                    ? {
                          ...prev,
                          postLikes: prev.postLikes.filter(
                              (like) => like.userId !== session.user.id
                          ),
                      }
                    : null
            );
        } else {
            // User is reacting or changing reaction
            const newLike = {
                id: -Date.now(), // Temporary client-side ID
                userId: session.user.id,
                type,
                postId: post.id,
                createdAt: new Date(),
                user: { id: session.user.id },
            };
            setPost((prev) =>
                prev
                    ? {
                          ...prev,
                          postLikes: [
                              ...prev.postLikes.filter(
                                  (like) => like.userId !== session.user.id
                              ),
                              newLike,
                          ],
                      }
                    : null
            );
        }

        try {
            if (currentUserReaction && currentUserReaction.type === type) {
                // Un-react
                const res = await fetch(`/api/posts/${post.id}/reactions`, {
                    method: "DELETE",
                });
                if (!res.ok) throw new Error("Failed to remove reaction");
            } else {
                // Add or change reaction
                const res = await fetch(`/api/posts/${post.id}/reactions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type }),
                });
                if (!res.ok) throw new Error("Failed to add reaction");
            }
        } catch (error) {
            console.error("Error handling reaction:", error);
            toast.error("Failed to update reaction");
            setPost(originalPost);
        }
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
        if (!post) return;
        if (
            !editText.trim() &&
            (!post.imageUrls || post.imageUrls.length === 0)
        ) {
            toast.error("Post content or an image is required.");
            return;
        }
        try {
            const res = await fetch(`/api/posts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: editText,
                    imageUrls: post.imageUrls,
                }),
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

    const currentUserReactionType = post.postLikes.find(
        (like) => like.userId === currentUser?.id
    )?.type;

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
                                className="bg-secondary-text text-secondary-bg py-1 px-3 rounded-md hover:bg-primary-text mr-2 w-20"
                            >
                                Save
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="bg-border-line text-secondary-bg py-1 px-3 rounded-md hover:bg-primary-text mr-2 w-20"
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
                                <Swiper
                                    modules={[Navigation, Pagination]}
                                    spaceBetween={10}
                                    slidesPerView={1}
                                    navigation
                                    pagination={{ clickable: true }}
                                    loop={true}
                                    className="mySwiper rounded-lg"
                                >
                                    {post.imageUrls.map((url, index) => (
                                        <SwiperSlide key={index}>
                                            <div
                                                className="relative w-full aspect-video bg-secondary-bg cursor-pointer"
                                                onClick={() =>
                                                    handleImageClick(index)
                                                }
                                            >
                                                <Image
                                                    src={url}
                                                    alt={`Post image ${
                                                        index + 1
                                                    }`}
                                                    fill
                                                    className="object-contain"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        )}
                    </>
                )}
                <div className="flex items-center justify-around md:justify-start md:space-x-2 mb-4">
                    {Object.values(ReactionType).map((type) => {
                        const Icon = reactionIcons[type];
                        return (
                            <button
                                key={type}
                                onClick={() => handleReaction(type)}
                                className={`flex items-center justify-center space-x-2 px-3 py-1 rounded-full border text-sm transition-colors ${currentUserReactionType === type
                                        ? "bg-primary-text text-secondary-bg border-primary-text"
                                        : "bg-secondary-bg text-primary-text border-border-line hover:bg-hover-bg"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-semibold text-xs">
                                    {post.postLikes.filter((like) => like.type === type).length}
                                </span>
                            </button>
                        )
                    })}
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
            {isImageModalOpen && (
                <ImageModal
                    imageUrls={post.imageUrls}
                    initialIndex={selectedImageIndex}
                    onClose={() => setIsImageModalOpen(false)}
                />
            )}
        </div>
    );
}
