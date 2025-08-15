"use client";

import { useState, useContext } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { PostWithRelations } from "@/types/prisma";
import { toast } from "sonner";
import { LoginPromptContext } from "@/context/LoginPromptContext";

interface CreatePostFormProps {
    onPostCreated: (newPost: PostWithRelations) => void;
}

const CreatePostForm = ({ onPostCreated }: CreatePostFormProps) => {
    const { data: session } = useSession();
    const [text, setText] = useState("");
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { setShowLoginPrompt } = useContext(LoginPromptContext);

    const handleClick = (e: React.MouseEvent) => {
        if (!session) {
            e.preventDefault();
            setShowLoginPrompt(true);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files);
            setImageFiles((prevFiles) => [...prevFiles, ...newFiles]);
            const newPreviews = newFiles.map((file) =>
                URL.createObjectURL(file)
            );
            setImagePreviews((prevPreviews) => [
                ...prevPreviews,
                ...newPreviews,
            ]);
        }
    };

    const handleRemoveImage = (index: number) => {
        setImageFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
        setImagePreviews((prevPreviews) => {
            const newPreviews = prevPreviews.filter((_, i) => i !== index);
            // Revoke the object URL to prevent memory leaks
            URL.revokeObjectURL(prevPreviews[index]);
            return newPreviews;
        });
    };

    const clearAllImages = () => {
        imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        setImageFiles([]);
        setImagePreviews([]);
        const fileInput = document.getElementById(
            "image-upload"
        ) as HTMLInputElement;
        if (fileInput) {
            fileInput.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session) {
            setShowLoginPrompt(true);
            return;
        }

        if (!text.trim() && imageFiles.length === 0) {
            toast.error("Post content or an image is required.");
            return;
        }

        setIsSubmitting(true);
        let imageUrls: string[] = [];

        try {
            if (imageFiles.length > 0) {
                const formData = new FormData();
                imageFiles.forEach((file) => {
                    formData.append("files", file);
                });

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error("Failed to upload images");
                }
                const { blobs } = await uploadRes.json();
                imageUrls = blobs.map((blob: { url: string }) => blob.url);
            }

            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, imageUrls }),
            });

            if (!res.ok) {
                throw new Error("Failed to create post");
            }
            const newPost = await res.json();
            onPostCreated(newPost);
            setText("");
            clearAllImages();
            toast.success("Post created successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Error creating post");
        } finally {
            setIsSubmitting(false);
        }
    };

    const baseButtonClasses = "inline-flex items-center justify-center font-semibold py-2 px-4 rounded-lg transition-colors duration-200 ease-in-out";

    return (
        <div className="bg-secondary-bg shadow-md rounded-lg p-6 mb-8">
            <form onSubmit={handleSubmit}>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onClick={handleClick}
                    placeholder="What's on your mind?"
                    className="w-full p-2 border border-border-line rounded-md focus:outline-none focus:ring-2 focus:ring-primary-text"
                    rows={3}
                    readOnly={!session}
                />
                {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                                <Image
                                    src={preview}
                                    alt={`Image preview ${index + 1}`}
                                    width={100}
                                    height={100}
                                    className="rounded-md w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-1 right-1 bg-primary-text text-primary-bg rounded-full p-1 leading-none transition-colors duration-200 ease-in-out hover:bg-opacity-80"
                                    aria-label={`Remove image ${index + 1}`}
                                >
                                    <span className="text-sm">&times;</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-between mt-4">
                    <label
                        htmlFor="image-upload"
                        onClick={handleClick}
                        className={`${baseButtonClasses} bg-border-line text-secondary-bg hover:bg-secondary-text cursor-pointer`}
                    >
                        Add Images
                        <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={isSubmitting}
                            data-testid="image-upload-input"
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={
                            isSubmitting ||
                            (!text.trim() && imageFiles.length === 0)
                        }
                        className={`${baseButtonClasses} bg-secondary-text text-secondary-bg hover:bg-primary-text disabled:bg-border-line`}
                    >
                        {isSubmitting ? "Posting..." : "Post"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePostForm;
