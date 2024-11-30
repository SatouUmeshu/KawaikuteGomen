'use client';
import React from 'react';
import { Slider } from "@/components/ui/slider";

interface ProgressBarProps {
  progress: number;
  currentTime: number;
  duration: number;
  onProgressChange: (value: number) => void;
}

export function ProgressBar({ progress, currentTime, duration, onProgressChange }: ProgressBarProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>播放进度</span>
        <span>
          {`${formatTime(currentTime)} / ${formatTime(duration)}`}
        </span>
      </div>
      <Slider
        value={[progress]}
        onValueChange={(value) => onProgressChange(value[0])}
        max={100}
        step={1}
      />
    </div>
  );
}
