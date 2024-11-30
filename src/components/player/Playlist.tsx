'use client';
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaylistItem } from './PlaylistItem';
import { AudioTrimmer } from './AudioTrimmer';

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
  onDeleteSong: (songId: string) => void;
  onPlaylistUpdate: (updatedPlaylist: Array<{
    id: string;
    title: string;
    artist: string;
    file: File;
  }>) => void;
  onPause: () => void;
}

export function Playlist({
  playlist,
  currentSong,
  onFileUpload,
  onSongSelect,
  canvasRef,
  onDeleteSong,
  onPlaylistUpdate,
  onPause,
}: PlaylistProps) {
  const [trimmerOpen, setTrimmerOpen] = useState(false);
  const [selectedFileForTrim, setSelectedFileForTrim] = useState<{
    file: File;
    id: string;
    title: string;
    artist: string;
  } | null>(null);

  const handleTrimComplete = (trimmedFile: File) => {
    if (!selectedFileForTrim) return;

    const originalName = selectedFileForTrim.title;
    const newTitle = originalName.includes("(Trimmed)") 
      ? originalName 
      : `${originalName} (Trimmed)`;

    const newSong = {
      id: crypto.randomUUID(),
      title: newTitle,
      artist: selectedFileForTrim.artist,
      file: trimmedFile
    };

    const originalIndex = playlist.findIndex(song => song.id === selectedFileForTrim.id);
    const newPlaylist = [...playlist];
    newPlaylist.splice(originalIndex + 1, 0, newSong);

    onPlaylistUpdate(newPlaylist);
  };

  const handleTrimStart = (song: { file: File; id: string; title: string; artist: string }) => {
    setSelectedFileForTrim(song);
    setTrimmerOpen(true);
    onPause?.();
  };

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

      <ScrollArea className="h-[300px] rounded-md border p-4 [&>[data-radix-scroll-area-viewport]]:!block [&>[data-radix-scroll-area-viewport]]:!min-w-0 [&>[data-radix-scroll-area-viewport]>div]:!block [&>[data-radix-scroll-area-viewport]>div]:!min-w-0">
        <div className="space-y-4">
          {playlist.map((song, index) => (
            <PlaylistItem
              key={song.id}
              id={song.id}
              index={index}
              title={song.title}
              artist={song.artist}
              isCurrentSong={currentSong === song.title}
              onSelect={() => onSongSelect(song.file)}
              onDelete={() => onDeleteSong(song.id)}
              canvasRef={currentSong === song.title ? canvasRef : undefined}
              onTrim={() => handleTrimStart(song)}
            />
          ))}
        </div>
      </ScrollArea>

      {selectedFileForTrim && (
        <AudioTrimmer
          file={selectedFileForTrim.file}
          isOpen={trimmerOpen}
          onClose={() => {
            setTrimmerOpen(false);
            setSelectedFileForTrim(null);
          }}
          onSave={handleTrimComplete}
          onDialogOpen={onPause}
        />
      )}
    </div>
  );
}
