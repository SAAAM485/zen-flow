
"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { PostWithRelations } from '@/types/prisma';
import { toast } from 'sonner';

interface CreatePostFormProps {
  onPostCreated: (newPost: PostWithRelations) => void;
}

const CreatePostForm = ({ onPostCreated }: CreatePostFormProps) => {
  const { data: session } = useSession();
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Clear the file input value
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) {
      toast.error('Post content or an image is required.');
      return;
    }
    if (!session) {
      toast.error('You must be logged in to create a post.');
      return;
    }

    setIsSubmitting(true);
    let imageUrl: string | null = null;

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const uploadRes = await fetch(`/api/upload?filename=${imageFile.name}`, {
          method: 'POST',
          body: imageFile,
          headers: {
            'Content-Type': imageFile.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload image');
        }
        const blob = await uploadRes.json();
        imageUrl = blob.url;
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, imageUrl }),
      });

      if (!res.ok) {
        throw new Error('Failed to create post');
      }
      const newPost = await res.json();
      onPostCreated(newPost);
      setText('');
      handleClearImage(); // Clear image after successful post
      toast.success('Post created successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Error creating post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <div className="bg-secondary-bg shadow-md rounded-lg p-6 mb-8">
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-2 border border-border-line rounded-md focus:outline-none focus:ring-2 focus:ring-primary-text"
          rows={3}
        />
        {imagePreview && (
          <div className="mt-4 relative">
            <Image src={imagePreview} alt="Image preview" width={200} height={200} className="rounded-md max-h-60 object-contain" />
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
              aria-label="Remove image"
            >
              &times;
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mt-4">
          <label htmlFor="image-upload" className="cursor-pointer bg-border-line text-primary-text py-2 px-4 rounded-md hover:bg-secondary-text">
            Add Image
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting || (!text.trim() && !imageFile)}
            className="bg-secondary-text text-secondary-bg py-2 px-4 rounded-md hover:bg-primary-text disabled:bg-border-line"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;
