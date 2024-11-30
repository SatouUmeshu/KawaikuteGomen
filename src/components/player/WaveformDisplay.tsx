'use client';
import React, { useEffect, useRef, useMemo } from 'react';

interface WaveformDisplayProps {
  audioBuffer: AudioBuffer;
  startPercentage: number;
  endPercentage: number;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onStartPercentageChange: (value: number) => void;
  onEndPercentageChange: (value: number) => void;
}

export function WaveformDisplay({
  audioBuffer,
  startPercentage,
  endPercentage,
  currentTime,
  duration,
  onSeek,
  onStartPercentageChange,
  onEndPercentageChange
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef<'playhead' | 'start' | 'end' | null>(null);
  const HANDLE_WIDTH = 1;
  const HANDLE_HITBOX_WIDTH = 12;
  const PADDING_X = 12;

  // 格式化时间函数，精确到毫秒
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // 将波形数据的计算移到组件外部，只在 audioBuffer 变化时重新计算
  const waveformData = useMemo(() => {
    const data = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.floor(data.length / 500);
    const values: number[] = [];
    let max = 0;

    for (let i = 0; i < 500; i++) {
      const startSample = i * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, data.length);
      let sum = 0;
      
      for (let j = startSample; j < endSample; j++) {
        sum += data[j] * data[j];
      }
      
      const rms = Math.sqrt(sum / (endSample - startSample));
      values.push(rms);
      max = Math.max(max, rms);
    }

    return { values, max };
  }, [audioBuffer]);

  // 渲染逻辑
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 绘制波形
    const drawWaveform = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      // 绘制背景
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      // 调整绘制区域，考虑内边距
      const drawableWidth = rect.width - (PADDING_X * 2);
      const startX = PADDING_X + ((startPercentage / 100) * drawableWidth);
      const endX = PADDING_X + ((endPercentage / 100) * drawableWidth);
      const centerY = rect.height / 2;
      const pointWidth = drawableWidth / waveformData.values.length;

      // 绘制波形
      waveformData.values.forEach((amplitude, i) => {
        const x = PADDING_X + (i * pointWidth);
        const y = (amplitude / waveformData.max) * (rect.height * 0.4);
        
        const isInSelection = x >= startX && x <= endX;
        ctx.strokeStyle = isInSelection ? '#3b82f6' : '#94a3b8';
        
        ctx.beginPath();
        ctx.moveTo(x, centerY - y);
        ctx.lineTo(x, centerY + y);
        ctx.stroke();
      });
    };

    // 绘制控制柄
    const drawHandles = () => {
      const drawableWidth = rect.width - (PADDING_X * 2);
      const startX = PADDING_X + ((startPercentage / 100) * drawableWidth);
      const endX = PADDING_X + ((endPercentage / 100) * drawableWidth);
      const playheadX = PADDING_X + ((currentTime / duration) * drawableWidth);

      // 绘制选区边界线和时间标签
      [startX, endX].forEach((x, index) => {
        const isHovered = isDraggingRef.current === (index === 0 ? 'start' : 'end');
        const time = (index === 0 ? startPercentage : endPercentage) / 100 * duration;
        
        // 绘制边界线
        ctx.beginPath();
        ctx.strokeStyle = isHovered ? '#60a5fa' : '#3b82f6';
        ctx.lineWidth = HANDLE_WIDTH;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();

        // 绘制小三角形标记
        ctx.beginPath();
        ctx.fillStyle = isHovered ? '#60a5fa' : '#3b82f6';
        ctx.moveTo(x - 4, 0);
        ctx.lineTo(x + 4, 0);
        ctx.lineTo(x, 4);
        ctx.fill();

        // 绘制时间标签
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#1e293b';
        const timeText = formatTime(time);
        const textWidth = ctx.measureText(timeText).width;
        const textX = Math.max(0, Math.min(x - textWidth / 2, rect.width - textWidth));
        ctx.fillText(timeText, textX, rect.height - 4);
      });

      // 绘制播放头（确保在选区范围内）
      const constrainedPlayheadX = Math.max(startX, Math.min(endX, playheadX));
      ctx.beginPath();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = HANDLE_WIDTH;
      ctx.moveTo(constrainedPlayheadX, 0);
      ctx.lineTo(constrainedPlayheadX, rect.height);
      ctx.stroke();
    };

    drawWaveform();
    drawHandles();
  }, [waveformData, startPercentage, endPercentage, currentTime, duration]);

  // 更新事件处理函数以考虑内边距
  const getHandleAtPosition = (x: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const drawableWidth = rect.width - (PADDING_X * 2);
    const startX = PADDING_X + ((startPercentage / 100) * drawableWidth);
    const endX = PADDING_X + ((endPercentage / 100) * drawableWidth);
    const playheadX = PADDING_X + ((currentTime / duration) * drawableWidth);

    if (Math.abs(x - startX) <= HANDLE_HITBOX_WIDTH/2) return 'start';
    if (Math.abs(x - endX) <= HANDLE_HITBOX_WIDTH/2) return 'end';
    if (Math.abs(x - playheadX) <= HANDLE_HITBOX_WIDTH/2) return 'playhead';
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const handle = getHandleAtPosition(x);
    
    if (handle) {
      isDraggingRef.current = handle;
      canvas.setPointerCapture(e.pointerId);
    } else {
      // 调整点击位置的百分比计算
      const drawableWidth = rect.width - (PADDING_X * 2);
      const adjustedX = Math.max(PADDING_X, Math.min(x, rect.width - PADDING_X)) - PADDING_X;
      const percentage = (adjustedX / drawableWidth) * 100;
      const newTime = (percentage / 100) * duration;
      const startTime = (startPercentage / 100) * duration;
      const endTime = (endPercentage / 100) * duration;
      const constrainedTime = Math.max(startTime, Math.min(endTime, newTime));
      onSeek(constrainedTime);
      
      isDraggingRef.current = 'playhead';
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(PADDING_X, Math.min(e.clientX - rect.left, rect.width - PADDING_X));
    const drawableWidth = rect.width - (PADDING_X * 2);
    const percentage = ((x - PADDING_X) / drawableWidth) * 100;

    switch (isDraggingRef.current) {
      case 'start':
        if (percentage < endPercentage) {
          onStartPercentageChange(percentage);
        }
        break;
      case 'end':
        if (percentage > startPercentage) {
          onEndPercentageChange(percentage);
        }
        break;
      case 'playhead': {
        const newTime = (percentage / 100) * duration;
        const startTime = (startPercentage / 100) * duration;
        const endTime = (endPercentage / 100) * duration;
        const constrainedTime = Math.max(startTime, Math.min(endTime, newTime));
        onSeek(constrainedTime);
        break;
      }
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = null;
  };

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-[150px] rounded-md cursor-pointer bg-slate-50"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
