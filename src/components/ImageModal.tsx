"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface ImageModalProps {
  imageUrls: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageModal({ imageUrls, initialIndex, onClose }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative w-full h-full max-w-screen-lg max-h-screen-lg" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-2 right-2 text-white text-3xl font-bold z-10"
          onClick={onClose}
        >
          &times;
        </button>
        <Image
          src={imageUrls[currentIndex]}
          alt={`Enlarged image ${currentIndex + 1}`}
          layout="fill"
          objectFit="scale-down"
          className="rounded-lg"
        />
        {imageUrls.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-5xl font-bold z-10 bg-black bg-opacity-50 rounded-full p-2"
              onClick={handlePrev}
            >
              &#8249;
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-5xl font-bold z-10 bg-black bg-opacity-50 rounded-full p-2"
              onClick={handleNext}
            >
              &#8250;
            </button>
          </>
        )}
      </div>
    </div>
  );
}
