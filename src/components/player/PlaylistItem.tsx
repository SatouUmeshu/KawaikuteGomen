'use client';
import React from 'react';
import { Trash2, Share2, Download, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface PlaylistItemProps {
  id: string;
  index: number;
  title: string;
  artist: string;
  isCurrentSong: boolean;
  onSelect: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  onDelete?: () => void;
  onTrim: () => void;
}

export function PlaylistItem({
  index,
  title,
  artist,
  isCurrentSong,
  onSelect,
  canvasRef,
  onDelete,
  onTrim,
}: PlaylistItemProps) {
  const [showCanvas, setShowCanvas] = React.useState(false);

  // 监听 isCurrentSong 的变化
  React.useEffect(() => {
    if (isCurrentSong) {
      // 立即重置状态
      setShowCanvas(false);
      // 等待序号隐藏动画完成后再显示频谱
      const timer = setTimeout(() => {
        setShowCanvas(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowCanvas(false);
    }
  }, [isCurrentSong]);

  return (
    <div
      className={`flex items-center p-2 rounded-lg hover:bg-accent group ${
        isCurrentSong ? 'bg-accent' : ''
      }`}
      style={{ userSelect: 'none' }}
    >
      <div 
        className="flex-1 flex items-center cursor-pointer min-w-0"
        onClick={onSelect}
      >
        <div className="w-[60px] h-[30px] flex-shrink-0 flex items-center justify-center relative">
          <span 
            className={`text-sm text-muted-foreground absolute transition-opacity duration-300 ease-in-out ${
              isCurrentSong ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ 
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {index + 1}
          </span>
          {isCurrentSong && (
            <canvas 
              ref={canvasRef}
              width="60"
              height="30"
              className="absolute transition-opacity duration-300 ease-in-out"
              style={{
                opacity: showCanvas ? '1' : '0'
              }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{title}</p>
          <p className="text-sm text-muted-foreground truncate">{artist}</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onTrim}>
            裁剪音乐
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>从列表中删除</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share2 className="mr-2 h-4 w-4" />
            <span>分享</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            <span>下载</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
