'use client';
import React, { useEffect, useRef, useCallback, useMemo } from 'react';

interface WaveformDisplayProps {
  audioBuffer: AudioBuffer;
  startPercentage: number;
  endPercentage: number;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

export function WaveformDisplay({
  audioBuffer,
  startPercentage,
  endPercentage,
  currentTime,
  duration,
  onSeek
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  
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

    const drawSegment = (x: number, amplitude: number, style: string) => {
      const y = (amplitude / waveformData.max) * (rect.height / 2) * 0.9;
      ctx.strokeStyle = style;
      ctx.beginPath();
      ctx.moveTo(x, rect.height / 2 - y);
      ctx.lineTo(x, rect.height / 2 + y);
      ctx.stroke();
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制波形
    const pointWidth = rect.width / waveformData.values.length;
    waveformData.values.forEach((amplitude, i) => {
      const x = i * pointWidth;
      const isInSelection = x >= (startPercentage / 100) * rect.width && 
                           x <= (endPercentage / 100) * rect.width;
      drawSegment(x, amplitude, isInSelection ? '#3b82f6' : '#e2e8f0');
    });

    // 绘制播放位置指示器
    const playbackX = (currentTime / duration) * rect.width;
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.moveTo(playbackX, 0);
    ctx.lineTo(playbackX, rect.height);
    ctx.stroke();

  }, [waveformData, startPercentage, endPercentage, currentTime, duration]);

  // 限制时间在选中区域内
  const constrainTime = useCallback((time: number) => {
    const startTime = (startPercentage / 100) * duration;
    const endTime = (endPercentage / 100) * duration;
    return Math.max(startTime, Math.min(endTime, time));
  }, [startPercentage, endPercentage, duration]);

  // 处理鼠标事件
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    isDraggingRef.current = true;
    canvas.setPointerCapture(e.pointerId);
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = constrainTime(percentage * duration);
    onSeek(newTime);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newTime = constrainTime(percentage * duration);
    onSeek(newTime);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[150px] rounded-md cursor-pointer"
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
