'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlaybackControls } from './PlaybackControls';
import { ProgressBar } from './ProgressBar';
import { Playlist } from './Playlist';
import { AudioVisualizer } from './AudioVisualizer';
import { Settings } from './Settings';
import { ChevronLeft, ChevronRight, GitBranch } from "lucide-react";
import { AlbumCover } from './AlbumCover';
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSong, setCurrentSong] = useState('');
  const [playlist, setPlaylist] = useState<Array<{
    id: string;
    title: string;
    artist: string;
    file: File;
  }>>([]);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [colorTransition, setColorTransition] = useState(0);
  const [playedSongs, setPlayedSongs] = useState<Set<string>>(new Set());
  const handleSongEndRef = useRef<() => void>();
  const [useCountdown, setUseCountdown] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout>();
  const [countdownMedia, setCountdownMedia] = useState<File | null>(null);
  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [currentFile, setCurrentFile] = useState<File | undefined>();
  const [showPanelHint, setShowPanelHint] = useState(true);
  const [isHoveringEdge, setIsHoveringEdge] = useState(false);

  const updateProgress = useCallback(() => {
    if (audio) {
      const progress = (audio.currentTime / audio.duration) * 100;
      setProgress(progress);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [audio]);

  useEffect(() => {
    if (audio) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [audio, updateProgress]);

  const handlePlayPause = useCallback(() => {
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [audio, isPlaying]);

  const handleProgressChange = (value: number) => {
    setProgress(value);
    if (audio) {
      const time = (value / 100) * audio.duration;
      audio.currentTime = time;
      
      // 如果是视频，同步更新视频的当前时间
      if (audio instanceof HTMLVideoElement) {
        const videoElements = document.getElementsByTagName('video');
        for (const video of videoElements) {
          video.currentTime = time;
        }
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const newSong = {
          id: crypto.randomUUID(),
          title: file.name,
          artist: '本地文件',
          file: file
        };
        setPlaylist(prev => [...prev, newSong]);
        
        if (files[0] === file) {
          playAudio(file);
        }
      });
    }
  };

  const playAudio = useCallback(async (file: File) => {
    // 先暂停当前播放
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }

    // 检查是否是当前正在播放的歌曲
    if (currentSong === file.name) {
      if (audio) {
        audio.currentTime = 0;
        audio.play();
        setIsPlaying(true);
      }
      return;
    }

    // 清理当前状态
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // 清除画布
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    // 确保之前的连接完全断开
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // 创建新的音频上下文
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      await ctx.resume();

      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;

      // 更新分析状态
      setAnalyser(null);
      await new Promise(resolve => setTimeout(resolve, 10));
      setAnalyser(analyserNode);

      // 根据文件类型创建不同的媒体元素
      const isVideo = file.type.startsWith('video/');
      const newMedia = isVideo ? 
        document.createElement('video') : 
        new Audio();
      newMedia.src = URL.createObjectURL(file);
      newMedia.addEventListener('ended', () => handleSongEndRef.current?.());
      
      if (isVideo && newMedia instanceof HTMLVideoElement) {
        newMedia.playsInline = true;
        newMedia.controls = false;
      }

      // 获取媒体时长
      await new Promise(resolve => {
        newMedia.addEventListener('loadedmetadata', () => {
          setDuration(newMedia.duration);
          resolve(null);
        }, { once: true });
      });

      // 建立音频连接
      sourceRef.current = ctx.createMediaElementSource(newMedia);
      sourceRef.current.connect(analyserNode);
      analyserNode.connect(ctx.destination);

      // 开始播放并更新状态
      await newMedia.play();
      setAudio(newMedia);
      setCurrentFile(file);
      setCurrentSong(file.name);
      setIsPlaying(true);

    } catch (error) {
      console.error('播放媒体时出错:', error);
    }
  }, [audio, currentSong]);

  // 清理函数
  useEffect(() => {
    const currentAnimationFrame = animationFrameRef.current;
    const currentSource = sourceRef.current;
    
    return () => {
      if (currentAnimationFrame) {
        cancelAnimationFrame(currentAnimationFrame);
      }
      if (currentSource) {
        currentSource.disconnect();
      }
    };
  }, []);

  // 初始化 AudioContext
  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 256;
    setAnalyser(analyserNode);
  }, []);

  // 空格键控制播放/暂停
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handlePlayPause]);

  // 颜色过渡动画
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setColorTransition(prev => {
        const target = isPlaying ? 1 : 0;
        const diff = target - prev;
        const transitionSpeed = isPlaying ? 0.2 : 0.05;
        
        if (Math.abs(diff) < 0.01) return target;
        return prev + diff * transitionSpeed;
      });
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  const handleDeleteSong = (songId: string) => {
    setPlaylist(prev => prev.filter(song => song.id !== songId));
    // 如果删除的是当前播放的歌曲，则停止播放
    const deletedSong = playlist.find(song => song.id === songId);
    if (deletedSong && deletedSong.title === currentSong) {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      setIsPlaying(false);
      setCurrentSong('');
    }
  };

  const handlePlaylistUpdate = (updatedPlaylist: Array<{
    id: string;
    title: string;
    artist: string;
    file: File;
  }>) => {
    setPlaylist(updatedPlaylist);
    // 暂停当前播放
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
    // 播放新的第一首歌
    if (updatedPlaylist.length > 0) {
      playAudio(updatedPlaylist[0].file);
    }
  };

  const handlePause = useCallback(() => {
    if (audio && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    }
  }, [audio, isPlaying]);

  const handleSongEnd = useCallback(() => {
    if (currentSong) {
      setPlayedSongs(prev => new Set(prev).add(currentSong));
    }

    const currentIndex = playlist.findIndex(song => song.title === currentSong);
    const remainingSongs = playlist.slice(currentIndex + 1)
      .filter(song => !playedSongs.has(song.title));

    const playNextSong = () => {
      if (remainingSongs.length > 0) {
        playAudio(remainingSongs[0].file);
      } else if (playedSongs.size < playlist.length) {
        const firstUnplayed = playlist
          .find(song => !playedSongs.has(song.title));
        if (firstUnplayed) {
          playAudio(firstUnplayed.file);
        }
      } else {
        setPlayedSongs(new Set());
        setIsPlaying(false);
      }
    };

    if (countdownMedia && useCountdown) {
      if (countdownAudioRef.current) {
        countdownAudioRef.current.src = URL.createObjectURL(countdownMedia);
        countdownAudioRef.current.play();
        // 使用媒体文件的实际时长作为倒计时
        countdownAudioRef.current.onloadedmetadata = () => {
          const duration = countdownAudioRef.current?.duration || 0;
          autoPlayTimerRef.current = setTimeout(playNextSong, duration * 1000);
        };
      }
    } else {
      playNextSong();
    }
  }, [currentSong, playlist, playedSongs, playAudio, countdownMedia, useCountdown]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, []);

  // 当播放列表更新时，重置已播放歌曲列表
  useEffect(() => {
    setPlayedSongs(new Set());
  }, [playlist]);

  useEffect(() => {
    handleSongEndRef.current = handleSongEnd;
  }, [handleSongEnd]);

  useEffect(() => {
    countdownAudioRef.current = new Audio();
    
    return () => {
      if (countdownAudioRef.current) {
        countdownAudioRef.current.pause();
        countdownAudioRef.current = null;
      }
    };
  }, []);

  // 处理鼠标移动事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const isNearEdge = e.clientX <= 20;
      setIsHoveringEdge(isNearEdge);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 首次展开后隐藏提示
  useEffect(() => {
    if (isPanelExpanded) {
      setShowPanelHint(false);
    }
  }, [isPanelExpanded]);

  return (
    <div className="flex min-h-screen">
      {/* 侧边控制面板 */}
      <div 
        className={`fixed left-0 top-0 h-full bg-background border-r shadow-lg transition-all duration-300 flex flex-col ${
          isPanelExpanded ? 'w-[400px]' : 'w-0'
        }`}
      >
        {/* 展开/收起按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-background border shadow-md transition-opacity duration-300 ${
            isPanelExpanded || isHoveringEdge ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        >
          {isPanelExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {/* 首次访问提示 */}
        {showPanelHint && !isPanelExpanded && (
          <div className="fixed left-4 top-4 bg-background border rounded-lg shadow-lg p-4 animate-pulse">
            <p className="text-sm text-muted-foreground">
              将鼠标移至屏幕左侧边缘<br />可展开控制面板
            </p>
          </div>
        )}

        {/* 控制面板内容 */}
        <div className={`h-full overflow-hidden transition-all duration-300 ${
          isPanelExpanded ? 'opacity-100 w-full' : 'opacity-0 w-0'
        }`}>
          <div className="p-6 space-y-6 flex-1 overflow-auto">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">音乐控制面板</h1>
              <Settings 
                useCountdown={useCountdown}
                onUseCountdownChange={setUseCountdown}
                countdownMedia={countdownMedia}
                onCountdownMediaChange={setCountdownMedia}
              />
            </div>
            
            <PlaybackControls 
              isPlaying={isPlaying}
              currentSong={currentSong}
              onPlayPause={handlePlayPause}
            />

            <ProgressBar 
              progress={progress}
              currentTime={audio?.currentTime || 0}
              duration={duration}
              onProgressChange={handleProgressChange}
            />

            <Playlist 
              playlist={playlist}
              currentSong={currentSong}
              useCountdown={useCountdown}
              setUseCountdown={setUseCountdown}
              countdownMedia={countdownMedia}
              setCountdownMedia={setCountdownMedia}
              onFileUpload={handleFileUpload}
              onSongSelect={playAudio}
              canvasRef={canvasRef}
              onDeleteSong={handleDeleteSong}
              onPlaylistUpdate={handlePlaylistUpdate}
              onPause={handlePause}
            />

            <AudioVisualizer 
              canvasRef={canvasRef}
              analyser={analyser}
              isPlaying={isPlaying}
              colorTransition={colorTransition}
            />

            {isPanelExpanded && (
              <div className="flex-shrink-0 p-6 pt-0">
                {process.env.NEXT_PUBLIC_COMMIT_REF && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GitBranch className="h-3 w-3" />
                    <span>{process.env.NEXT_PUBLIC_COMMIT_REF.slice(0, 7)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 专辑封面区域 */}
      <AlbumCover 
        currentSong={currentSong}
        isPanelExpanded={isPanelExpanded}
        currentFile={currentFile}
        mediaElement={audio || undefined}
      />
    </div>
  );
}
