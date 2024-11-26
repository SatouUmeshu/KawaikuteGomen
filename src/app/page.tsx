'use client';

import { useState, useEffect } from 'react';
import { Hero } from '@/components/Hero';
import { AlbumCarousel } from '@/components/AlbumCarousel';

export default function Home() {
  const [albumImages, setAlbumImages] = useState<string[]>([]);

  useEffect(() => {
    const getRandomAlbums = async () => {
      try {
        const response = await fetch('/api/albums');
        const files = await response.json();
        
        const selectedFiles = [];
        const filesCopy = [...files];
        
        const numImages = Math.min(10, files.length);
        
        for (let i = 0; i < numImages; i++) {
          const randomIndex = Math.floor(Math.random() * filesCopy.length);
          selectedFiles.push(filesCopy[randomIndex]);
          filesCopy.splice(randomIndex, 1);
        }
        
        while (selectedFiles.length < 10) {
          const randomIndex = Math.floor(Math.random() * files.length);
          selectedFiles.push(files[randomIndex]);
        }
        
        setAlbumImages(selectedFiles);
      } catch (error) {
        console.error('Error fetching albums:', error);
      }
    };

    getRandomAlbums();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Hero />
      <AlbumCarousel albumImages={albumImages} />
    </div>
  );
}
