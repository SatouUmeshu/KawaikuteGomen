'use client';
import React from 'react';

interface PlaylistItemProps {
  id: string;
  index: number;
  title: string;
  artist: string;
  isCurrentSong: boolean;
  onSelect: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

export function PlaylistItem({
  index,
  title,
  artist,
  isCurrentSong,
  onSelect,
  canvasRef
}: PlaylistItemProps) {
  return (
    <div
      className={`flex items-center p-2 rounded-lg hover:bg-accent cursor-pointer ${
        isCurrentSong ? 'bg-accent' : ''
      }`}
      onClick={onSelect}
      style={{ userSelect: 'none' }}
    >
      <div className="min-w-[60px] h-[30px] flex-shrink-0 flex items-center justify-center relative">
        <span 
          className={`text-sm text-muted-foreground absolute transition-opacity duration-300 ease-in-out ${
            isCurrentSong ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ 
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {index + 1}
        </span>
        {isCurrentSong && (
          <canvas 
            ref={canvasRef}
            width="60"
            height="30"
            className="absolute transition-opacity duration-300 ease-in-out"
            style={{
              opacity: isCurrentSong ? '1' : '0',
              transitionDelay: '300ms'
            }}
          />
        )}
      </div>
      <div className="w-[45%] overflow-hidden">
        <p className="font-medium truncate">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{artist}</p>
      </div>
    </div>
  );
}