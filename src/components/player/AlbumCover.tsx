'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Music } from "lucide-react";
import * as mm from 'music-metadata-browser';
import Image from 'next/image';

interface AlbumCoverProps {
  currentSong: string;
  isPanelExpanded: boolean;
  currentFile?: File;
  mediaElement?: HTMLAudioElement | HTMLVideoElement;
}

export function AlbumCover({ currentSong, isPanelExpanded, currentFile, mediaElement }: AlbumCoverProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isVideo = currentFile?.type.startsWith('video/');

  useEffect(() => {
    let isMounted = true;

    const loadCover = async () => {
      if (!currentFile) {
        setCoverUrl(null);
        return;
      }

      if (isVideo) {
        setCoverUrl(null);
        return;
      }

      try {
        const metadata = await mm.parseBlob(currentFile);
        const picture = metadata.common.picture?.[0];
        
        if (picture) {
          const blob = new Blob([picture.data], { type: picture.format });
          const url = URL.createObjectURL(blob);
          
          if (isMounted) {
            setCoverUrl(url);
          }
          
          return url;
        } else {
          setCoverUrl(null);
        }
      } catch (error) {
        console.error('获取封面失败:', error);
        if (isMounted) {
          setCoverUrl(null);
        }
      }
    };

    loadCover().then(url => {
      return () => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      };
    });

    return () => {
      isMounted = false;
    };
  }, [currentFile, isVideo]);

  useEffect(() => {
    if (isVideo && mediaElement instanceof HTMLVideoElement && videoRef.current) {
      const video = videoRef.current;
      
      // 同步视频状态的函数
      const syncVideoState = async () => {
        if (Math.abs(video.currentTime - mediaElement.currentTime) > 0.1) {
          video.currentTime = mediaElement.currentTime;
        }
        
        if (!mediaElement.paused && video.paused) {
          try {
            // 使用 catch 来处理可能的播放错误
            await video.play().catch(() => {
              // 如果播放失败，不抛出错误，只让视频保持暂停状态
              console.debug('catch 到视频播放被浏览器省电行为阻止');
            });
          } catch (error) {
            console.debug('视频播放出错:', error);
          }
        } else if (mediaElement.paused && !video.paused) {
          video.pause();
        }
      };

      // 添加 visibilitychange 事件监听
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          syncVideoState();
        } else {
          // 当页面不可见时，主动暂停视频以避免不必要的资源消耗
          video.pause();
        }
      };

      // 定期同步视频状态，但只在页面可见时执行
      const syncInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          syncVideoState();
        }
      }, 1000);
      
      // 添加事件监听
      document.addEventListener('visibilitychange', handleVisibilityChange);
      mediaElement.addEventListener('play', () => {
        if (document.visibilityState === 'visible') {
          syncVideoState();
        }
      });
      mediaElement.addEventListener('pause', () => video.pause());
      mediaElement.addEventListener('seeking', () => {
        video.currentTime = mediaElement.currentTime;
      });

      return () => {
        clearInterval(syncInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isVideo, mediaElement]);

  return (
    <div 
      className={`flex-1 flex items-center justify-center transition-all duration-300 ${
        isPanelExpanded ? 'ml-[416px]' : 'ml-0'
      }`}
    >
      <div className="aspect-square max-w-[600px] w-full bg-slate-100 rounded-lg flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {isVideo && mediaElement instanceof HTMLVideoElement ? (
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              controls={false}
              src={mediaElement.src}
              muted
              onLoadedMetadata={() => {
                if (videoRef.current && mediaElement) {
                  videoRef.current.currentTime = mediaElement.currentTime;
                }
              }}
            />
          </div>
        ) : coverUrl ? (
          <div className="absolute inset-0">
            <Image 
              src={coverUrl} 
              alt="专辑封面" 
              fill
              className="object-contain"
              unoptimized
            />
            <div 
              className="absolute inset-0 -z-10" 
              style={{
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px)',
                opacity: 0.5,
                transform: 'scale(1.1)'
              }}
            />
          </div>
        ) : (
          <>
            <Music className="w-32 h-32 text-slate-400 mb-4" />
            <h2 className="text-xl font-medium text-slate-600 text-center break-all">
              {currentSong || '未选择音乐'}
            </h2>
          </>
        )}
      </div>
    </div>
  );
} 
