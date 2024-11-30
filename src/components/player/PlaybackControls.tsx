'use client';
import React from 'react';
import { Button } from "@/components/ui/button";

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentSong: string;
  onPlayPause: () => void;
}

export function PlaybackControls({ isPlaying, currentSong, onPlayPause }: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-lg truncate max-w-[70%]">
        当前播放：{currentSong}
      </span>
      <Button
        variant={isPlaying ? "secondary" : "default"}
        onClick={onPlayPause}
      >
        {isPlaying ? "暂停" : "播放"}
      </Button>
    </div>
  );
}
