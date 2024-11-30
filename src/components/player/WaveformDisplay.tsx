'use client';
import React, { useEffect, useRef, useCallback } from 'react';

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

  // 渲染波形和播放指示器
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 使用设备像素比来提高清晰度
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = audioBuffer.getChannelData(0);
    const width = rect.width;
    const height = rect.height;
    const samplesPerPixel = Math.floor(data.length / width);

    const calculateRMS = (samples: Float32Array, start: number, length: number) => {
      let sum = 0;
      for (let i = start; i < start + length && i < samples.length; i++) {
        sum += samples[i] * samples[i];
      }
      return Math.sqrt(sum / length);
    };

    let maxRMS = 0;
    for (let x = 0; x < width; x++) {
      const startSample = Math.floor(x * samplesPerPixel);
      const rms = calculateRMS(data, startSample, samplesPerPixel);
      maxRMS = Math.max(maxRMS, rms);
    }

    const amplificationFactor = 0.8;
    const normalizeHeight = (rms: number) => (rms / maxRMS) * (height / 2) * amplificationFactor;

    ctx.scale(dpr, dpr);

    // 绘制背景波形
    ctx.beginPath();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    for (let x = 0; x < rect.width; x++) {
      const startSample = Math.floor(x * samplesPerPixel);
      const rms = calculateRMS(data, startSample, samplesPerPixel);
      const y = normalizeHeight(rms);
      ctx.moveTo(x, rect.height / 2 - y);
      ctx.lineTo(x, rect.height / 2 + y);
    }
    ctx.stroke();

    // 绘制选中区域的波形
    const startX = rect.width * (startPercentage / 100);
    const endX = rect.width * (endPercentage / 100);

    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 1)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.8)');

    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;

    for (let x = startX; x < endX; x++) {
      const startSample = Math.floor(x * samplesPerPixel);
      const rms = calculateRMS(data, startSample, samplesPerPixel);
      const y = normalizeHeight(rms);
      ctx.moveTo(x, rect.height / 2 - y);
      ctx.lineTo(x, rect.height / 2 + y);
    }
    ctx.stroke();

    // 绘制播放位置指示器
    const playbackX = (currentTime / duration) * rect.width;
    
    // 绘制播放位置线
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.moveTo(playbackX, 0);
    ctx.lineTo(playbackX, rect.height);
    ctx.stroke();

    // 绘制播放位置手柄
    ctx.beginPath();
    ctx.fillStyle = '#ef4444';
    const handleSize = 8;
    ctx.arc(playbackX, handleSize, handleSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // 绘制选区边界
    const drawBoundary = (x: number) => {
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.fillStyle = '#3b82f6';
      const boundaryHandleHeight = 20;
      const boundaryHandleWidth = 4;
      ctx.roundRect(
        x - boundaryHandleWidth / 2,
        rect.height / 2 - boundaryHandleHeight / 2,
        boundaryHandleWidth,
        boundaryHandleHeight,
        2
      );
      ctx.fill();
    };

    drawBoundary(startX);
    drawBoundary(endX);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(startX, 0, endX - startX, rect.height);

  }, [audioBuffer, startPercentage, endPercentage, currentTime, duration]);

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
