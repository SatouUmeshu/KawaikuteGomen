'use client';

import Image from "next/image";
import { useState, useEffect } from 'react';

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
      <div className="relative w-full lg:absolute lg:left-0 lg:top-0 lg:w-[45%] h-full z-30 p-6 lg:p-12 flex items-center bg-background/90 lg:bg-transparent">
        <div className="w-full">
          <h1 className="text-4xl lg:text-6xl font-bold mb-4 lg:mb-6">Kawaikute Gomen</h1>
          <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300">
            Kawaikute Gomen is an open-source Otaku Dance control tool.
          </p>
        </div>
      </div>

      <div className="absolute right-0 top-0 w-full lg:w-[65%] h-full overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-20 lg:from-10%" />
        
        <div className="relative w-full overflow-hidden">
          <div className="flex flex-nowrap">
            <div className="flex animate-marquee">
              {albumImages.map((image, index) => (
                <div
                  key={`album-${index}`}
                  className="w-64 h-64 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 mx-4"
                >
                  <Image
                    src={image}
                    alt={`Album cover ${index + 1}`}
                    width={256}
                    height={256}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
              {albumImages.map((image, index) => (
                <div
                  key={`album-copy-${index}`}
                  className="w-64 h-64 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 mx-4"
                >
                  <Image
                    src={image}
                    alt={`Album cover ${index + 1}`}
                    width={256}
                    height={256}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
