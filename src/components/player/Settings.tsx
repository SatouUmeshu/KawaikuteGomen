'use client';
import React from 'react';
import { Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface SettingsProps {
  useCountdown: boolean;
  onUseCountdownChange: (use: boolean) => void;
  countdownMedia: File | null;
  onCountdownMediaChange: (file: File | null) => void;
}

export function Settings({ 
  useCountdown,
  onUseCountdownChange,
  countdownMedia,
  onCountdownMediaChange 
}: SettingsProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onCountdownMediaChange(file);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>播放设置</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>使用倒计时</Label>
              <Switch
                checked={useCountdown}
                onCheckedChange={onUseCountdownChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="countdownMedia">倒计时媒体文件</Label>
            <div className="flex items-center gap-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                onClick={() => document.getElementById('countdownMedia')?.click()}
              >
                选择
              </Button>
              <div className="flex-1 min-w-0 max-w-[200px]">
                <span className="text-sm text-muted-foreground truncate block">
                  {countdownMedia ? countdownMedia.name : '未选择文件'}
                </span>
              </div>
              {countdownMedia && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 px-2"
                  onClick={() => onCountdownMediaChange(null)}
                >
                  清除
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              支持音频或视频文件，将在切歌时播放
            </p>
          </div>
        </div>
        <Input
          type="file"
          id="countdownMedia"
          accept="audio/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
} 