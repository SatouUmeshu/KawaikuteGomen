import React from 'react';
import Image from "next/image";

interface AlbumCarouselProps {
  albumImages: string[];
}

export function AlbumCarousel({ albumImages }: AlbumCarouselProps) {
  return (
    <div className="absolute right-0 top-0 w-full lg:w-[65%] h-full overflow-hidden flex items-center">
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-20 lg:from-10%" />
      
      <div className="relative w-full overflow-hidden">
        <div className="flex flex-nowrap">
          <div className="flex animate-marquee">
            {[...Array(2)].map((_, arrayIndex) => (
              albumImages.map((image, index) => (
                <div
                  key={`album-${arrayIndex}-${index}`}
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
              ))
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
