'use client';
import React, { useState, useEffect } from 'react';
import { Music } from "lucide-react";
import * as mm from 'music-metadata-browser';
import Image from 'next/image';

interface AlbumCoverProps {
  currentSong: string;
  isPanelExpanded: boolean;
  currentFile?: File;
}

export function AlbumCover({ currentSong, isPanelExpanded, currentFile }: AlbumCoverProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCover = async () => {
      if (!currentFile) {
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
      // 清理之前的 URL
      return () => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      };
    });

    return () => {
      isMounted = false;
    };
  }, [currentFile]);

  return (
    <div 
      className={`flex-1 flex items-center justify-center transition-all duration-300 ${
        isPanelExpanded ? 'ml-[416px]' : 'ml-0'
      }`}
    >
      <div className="aspect-square max-w-[600px] w-full bg-slate-100 rounded-lg flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {coverUrl ? (
          <div className="absolute inset-0">
            <Image 
              src={coverUrl} 
              alt="专辑封面" 
              fill
              className="object-contain"
              unoptimized
            />
            {/* 模糊背景 */}
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
