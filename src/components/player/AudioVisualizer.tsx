'use client';
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  colorTransition: number;
}

export function AudioVisualizer({
  canvasRef,
  analyser,
  isPlaying,
  colorTransition
}: AudioVisualizerProps) {
  const animationFrameRef = useRef<number>();

  const roundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser?.frequencyBinCount || 0;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser?.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = 4;
      const barSpacing = 1;
      const barCount = 5;
      const step = Math.floor(bufferLength / barCount);
      const minHeight = 4;
      
      // 颜色过渡设置
      const startColor = { r: 128, g: 128, b: 128 }; // #808080
      const endColor = { r: 0, g: 0, b: 0 };         // #000000
      
      const currentR = Math.round(startColor.r + (endColor.r - startColor.r) * colorTransition);
      const currentG = Math.round(startColor.g + (endColor.g - startColor.g) * colorTransition);
      const currentB = Math.round(startColor.b + (endColor.b - startColor.b) * colorTransition);
      
      ctx.fillStyle = `rgb(${currentR}, ${currentG}, ${currentB})`;
      ctx.globalAlpha = 0.5 + (0.5 * colorTransition);
      
      const centerX = canvas.width / 2;

      // 绘制中间频谱（1条）
      const centerDataIndex = 2 * step;
      let centerBarHeight = (dataArray[centerDataIndex] / 255) * canvas.height * 0.8;
      centerBarHeight = Math.max(centerBarHeight, minHeight);
      
      roundedRect(
        ctx,
        centerX - barWidth / 2,
        canvas.height / 2 - centerBarHeight / 2,
        barWidth,
        centerBarHeight,
        barWidth / 2
      );

      // 绘制左侧频谱（2条）
      for (let i = 0; i < 2; i++) {
        const leftDataIndex = i * step;
        let leftBarHeight = (dataArray[leftDataIndex] / 255) * canvas.height * 0.8;
        leftBarHeight = Math.max(leftBarHeight, minHeight);
        
        roundedRect(
          ctx,
          centerX - (i + 1) * (barWidth + barSpacing) - barWidth / 2,
          canvas.height / 2 - leftBarHeight / 2,
          barWidth,
          leftBarHeight,
          barWidth / 2
        );
      }

      // 绘制右侧频谱（2条）
      for (let i = 0; i < 2; i++) {
        const rightDataIndex = (i + 3) * step;
        let rightBarHeight = (dataArray[rightDataIndex] / 255) * canvas.height * 0.8;
        rightBarHeight = Math.max(rightBarHeight, minHeight);
        
        roundedRect(
          ctx,
          centerX + (i + 1) * (barWidth + barSpacing) - barWidth / 2,
          canvas.height / 2 - rightBarHeight / 2,
          barWidth,
          rightBarHeight,
          barWidth / 2
        );
      }
    };

    draw();

    // 清理函数
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, analyser, colorTransition, canvasRef]);

  return null;
}
