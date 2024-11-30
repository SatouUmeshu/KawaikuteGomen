'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlaybackControls } from './PlaybackControls';
import { ProgressBar } from './ProgressBar';
import { Playlist } from './Playlist';
import { AudioVisualizer } from './AudioVisualizer';

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

  const updateProgress = useCallback(() => {
    if (audio) {
      const progress = (audio.currentTime / audio.duration) * 100;
      setProgress(Math.round(progress));
    }
  }, [audio]);

  useEffect(() => {
    if (audio) {
      audio.addEventListener('timeupdate', updateProgress);
      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
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

  const playAudio = async (file: File) => {
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

      // 更新分析器状态
      setAnalyser(null);
      await new Promise(resolve => setTimeout(resolve, 10));
      setAnalyser(analyserNode);

      // 创建和准备新的音频实例
      const newAudio = new Audio(URL.createObjectURL(file));
      
      // 获取音频时长
      await new Promise(resolve => {
        newAudio.addEventListener('loadedmetadata', () => {
          setDuration(newAudio.duration);
          resolve(null);
        }, { once: true });
      });

      // 建立音频连接
      sourceRef.current = ctx.createMediaElementSource(newAudio);
      sourceRef.current.connect(analyserNode);
      analyserNode.connect(ctx.destination);

      // 开始播放并更新状态
      await newAudio.play();
      setAudio(newAudio);
      setCurrentSong(file.name);
      setIsPlaying(true);

    } catch (error) {
      console.error('播放音频时出错:', error);
    }
  };

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

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto bg-card rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-6">音乐控制面板</h1>
        
        <div className="space-y-6">
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
            onFileUpload={handleFileUpload}
            onSongSelect={playAudio}
            canvasRef={canvasRef}
            onDeleteSong={handleDeleteSong}
          />

          <AudioVisualizer 
            canvasRef={canvasRef}
            analyser={analyser}
            isPlaying={isPlaying}
            colorTransition={colorTransition}
          />
        </div>
      </div>
    </div>
  );
}
