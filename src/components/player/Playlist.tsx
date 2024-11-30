'use client';
import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaylistItem } from './PlaylistItem';

interface PlaylistProps {
  playlist: Array<{
    id: string;
    title: string;
    artist: string;
    file: File;
  }>;
  currentSong: string;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSongSelect: (file: File) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function Playlist({
  playlist,
  currentSong,
  onFileUpload,
  onSongSelect,
  canvasRef
}: PlaylistProps) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">播放列表</h2>
      
      <div className="mb-4">
        <input
          type="file"
          accept="audio/*"
          onChange={onFileUpload}
          className="hidden"
          id="audio-upload"
          multiple
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById('audio-upload')?.click()}
          className="w-full"
        >
          上传音乐
        </Button>
      </div>

      <ScrollArea className="h-[300px] rounded-md border p-4">
        <div className="space-y-4">
          {playlist.map((song, index) => (
            <PlaylistItem
              key={`${song.id}`}
              id={`${song.id}`}
              index={index}
              title={song.title}
              artist={song.artist}
              isCurrentSong={currentSong === song.title}
              onSelect={() => onSongSelect(song.file)}
              canvasRef={currentSong === song.title ? canvasRef : undefined}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
