'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import audioBufferToWav from 'audiobuffer-to-wav';
import { WaveformDisplay } from './WaveformDisplay';
import { TimeInput } from './TimeInput';
import { Loader2 } from "lucide-react";

interface AudioTrimmerProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
  onSave: (trimmedFile: File) => void;
  onDialogOpen?: () => void;
}

export function AudioTrimmer({ file, isOpen, onClose, onSave, onDialogOpen }: AudioTrimmerProps) {
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(100);
  const [duration, setDuration] = useState<number>(0);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [previewTime, setPreviewTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // 使用 useRef 来存储 requestAnimationFrame 的 ID
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (file && isOpen) {
      setIsLoading(true);
      const loadAudio = async () => {
        try {
          // 创建音频上下文和预览音频
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const arrayBuffer = await file.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          setAudioBuffer(audioBuffer);
          setDuration(audioBuffer.duration);
          
          const audio = new Audio(URL.createObjectURL(file));
          setPreviewAudio(audio);
        } catch (error) {
          console.error('音频加载失败:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadAudio();
    }
  }, [file, isOpen]);

  // 更新预览时间的函数
  useEffect(() => {
    if (previewAudio && isPreviewPlaying) {
      const updateTime = () => {
        setPreviewTime(previewAudio.currentTime);
        animationFrameRef.current = requestAnimationFrame(updateTime);
      };
      animationFrameRef.current = requestAnimationFrame(updateTime);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [previewAudio, isPreviewPlaying]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
            {/* 开始和结束时间控制 */}
            {audioBuffer && !isLoading && (
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="opacity-50">开始</span>
                  <TimeInput
                    time={(startTime / 100) * duration}
                    onChange={(newTime) => {
                      const newPercentage = (newTime / duration) * 100;
                      if (newPercentage < endTime) {
                        setStartTime(newPercentage);
                        if (previewTime < newTime) {
                          if (previewAudio) {
                            previewAudio.currentTime = newTime;
                            setPreviewTime(newTime);
                          }
                        }
                      }
                    }}
                    max={duration}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="opacity-50">结束</span>
                  <TimeInput
                    time={(endTime / 100) * duration}
                    onChange={(newTime) => {
                      const newPercentage = (newTime / duration) * 100;
                      if (newPercentage > startTime) {
                        setEndTime(newPercentage);
                      }
                    }}
                    max={duration}
                  />
                </div>
              </div>
            )}

            {/* 波形显示区域 - 移除圆角和边框 */}
            <div className="bg-background h-[150px] flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : audioBuffer ? (
                <WaveformDisplay
                  audioBuffer={audioBuffer}
                  startPercentage={startTime}
                  endPercentage={endTime}
                  currentTime={previewTime}
                  duration={duration}
                  onPlayPause={handlePreview}
                  onSeek={handleSeek}
                  onStartPercentageChange={value => {
                    setStartTime(value);
                    if (previewTime < (value / 100) * duration) {
                      const newTime = (value / 100) * duration;
                      if (previewAudio) {
                        previewAudio.currentTime = newTime;
                        setPreviewTime(newTime);
                      }
                    }
                  }}
                  onEndPercentageChange={value => setEndTime(value)}
                />
              ) : null}
            </div>

            {/* 当前时间和总时长显示 */}
            <div className="flex justify-between items-center px-1">
              <TimeInput
                time={previewTime}
                onChange={(newTime) => {
                  if (previewAudio) {
                    const startTimeSeconds = (startTime / 100) * duration;
                    const endTimeSeconds = (endTime / 100) * duration;
                    const constrainedTime = Math.max(startTimeSeconds, Math.min(endTimeSeconds, newTime));
                    previewAudio.currentTime = constrainedTime;
                    setPreviewTime(constrainedTime);
                  }
                }}
                max={duration}
              />
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="opacity-50">选区时长</span>
                <TimeInput
                  time={(endTime - startTime) / 100 * duration}
                  onChange={(newDuration) => {
                    const newEndPercentage = ((newDuration / duration) * 100) + startTime;
                    if (newEndPercentage <= 100) {
                      setEndTime(newEndPercentage);
                    }
                  }}
                  max={duration}
                />
              </div>
            </div>

            {/* 预览按钮 */}
            <Button 
              variant="secondary" 
              onClick={handlePreview}
              className="w-full"
            >
              {isPreviewPlaying ? "暂停" : "播放"}
            </Button>
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