'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import audioBufferToWav from 'audiobuffer-to-wav';
import { WaveformDisplay } from './WaveformDisplay';

interface AudioTrimmerProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
  onSave: (trimmedFile: File) => void;
  onDialogOpen?: () => void;
}

export function AudioTrimmer({ file, isOpen, onClose, onSave, onDialogOpen }: AudioTrimmerProps) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(100);
  const [duration, setDuration] = useState(0);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [previewTime, setPreviewTime] = useState(0);

  useEffect(() => {
    if (isOpen) {
      onDialogOpen?.();
      
      // 创建音频上下文和预览音频
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audio = new Audio(URL.createObjectURL(file));
      
      // 加载音频缓冲区用于波形显示
      file.arrayBuffer()
        .then(buffer => audioContext.decodeAudioData(buffer))
        .then(decodedBuffer => {
          setAudioBuffer(decodedBuffer);
        })
        .catch(error => {
          console.error('加载音频数据失败:', error);
        });

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      setPreviewAudio(audio);

      return () => {
        audio.pause();
        audio.src = '';
        setPreviewAudio(null);
        setAudioBuffer(null);
      };
    }
  }, [file, isOpen, onDialogOpen]);

  const formatTime = (percentage: number) => {
    const seconds = (percentage / 100) * duration;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTrim = async () => {
    const audioContext = new AudioContext();
    const audioBuffer = await file.arrayBuffer()
      .then(buffer => audioContext.decodeAudioData(buffer));
    
    const startSample = Math.floor((startTime / 100) * audioBuffer.length);
    const endSample = Math.floor((endTime / 100) * audioBuffer.length);
    
    const trimmedBuffer = new AudioContext().createBuffer(
      audioBuffer.numberOfChannels,
      endSample - startSample,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      trimmedBuffer.copyToChannel(
        channelData.slice(startSample, endSample),
        channel
      );
    }

    const trimmedBlob = await audioBufferToWave(trimmedBuffer);
    const trimmedFile = new File([trimmedBlob], `trimmed_${file.name}`, {
      type: file.type,
    });

    onSave(trimmedFile);
    onClose();
  };

  const handlePreview = useCallback(async () => {
    if (!previewAudio) return;

    if (isPreviewPlaying) {
      previewAudio.pause();
      setIsPreviewPlaying(false);
    } else {
      try {
        await previewAudio.play();
        setIsPreviewPlaying(true);

        const checkTime = () => {
          if (previewAudio.currentTime >= (endTime / 100) * duration) {
            previewAudio.pause();
            setIsPreviewPlaying(false);
          } else if (isPreviewPlaying) {
            requestAnimationFrame(checkTime);
          }
        };
        checkTime();
      } catch (error) {
        console.error('预览播放失败:', error);
      }
    }
  }, [previewAudio, isPreviewPlaying, endTime, duration]);

  const handleClose = () => {
    if (previewAudio) {
      previewAudio.pause();
      setIsPreviewPlaying(false);
    }
    onClose();
  };

  const handleSeek = (time: number) => {
    if (previewAudio) {
      previewAudio.currentTime = time;
      setPreviewTime(time);
    }
  };

  // 更新预览时间
  useEffect(() => {
    if (previewAudio) {
      previewAudio.addEventListener('timeupdate', () => {
        setPreviewTime(previewAudio.currentTime);
      });
    }
  }, [previewAudio]);

  // 阻止事件冒泡
  const handleDialogKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      handlePreview();
    }
  }, [handlePreview]);

  useEffect(() => {
    if (isOpen) {
      onDialogOpen?.();
      document.addEventListener('keydown', handleDialogKeyDown);
      return () => document.removeEventListener('keydown', handleDialogKeyDown);
    }
  }, [isOpen, onDialogOpen, handleDialogKeyDown]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>裁剪音乐</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            {/* 波形显示 */}
            {audioBuffer && (
              <div className="border rounded-md p-4 bg-background">
                <WaveformDisplay
                  audioBuffer={audioBuffer}
                  startPercentage={startTime}
                  endPercentage={endTime}
                  currentTime={previewTime}
                  duration={duration}
                  onPlayPause={handlePreview}
                  onSeek={handleSeek}
                />
              </div>
            )}

            {/* 开始时间滑块 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>开始时间</span>
                <span>{formatTime(startTime)}</span>
              </div>
              <Slider
                value={[startTime]}
                onValueChange={([value]) => {
                  if (value < endTime) {
                    setStartTime(value);
                    if (previewAudio && isPreviewPlaying) {
                      previewAudio.currentTime = (value / 100) * duration;
                    }
                  }
                }}
                max={100}
                step={0.1}
              />
            </div>

            {/* 结束时间滑块 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>结束时间</span>
                <span>{formatTime(endTime)}</span>
              </div>
              <Slider
                value={[endTime]}
                onValueChange={([value]) => {
                  if (value > startTime) {
                    setEndTime(value);
                  }
                }}
                max={100}
                step={0.1}
              />
            </div>

            {/* 预览按钮 */}
            <Button 
              variant="secondary" 
              onClick={handlePreview}
              className="w-full"
            >
              {isPreviewPlaying ? "停止预览" : "预览"}
            </Button>

            {/* 总时长显示 */}
            <div className="text-sm text-muted-foreground text-right">
              总时长：{formatTime(endTime - startTime)}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button onClick={handleTrim}>
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 更新辅助函数：将AudioBuffer转换为Wave文件
function audioBufferToWave(audioBuffer: AudioBuffer): Promise<Blob> {
  return new Promise((resolve) => {
    // 将 AudioBuffer 转换为 WAV 格式的 Uint8Array
    const wavData = audioBufferToWav(audioBuffer);
    
    // 创建 Blob 对象
    const blob = new Blob([wavData], { type: 'audio/wav' });
    
    resolve(blob);
  });
}