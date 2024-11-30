'use client';
import React, { useState, useEffect, useRef } from 'react';

interface TimeInputProps {
  time: number;
  onChange: (time: number) => void;
  max: number;
  className?: string;
}

export function TimeInput({ time, onChange, max, className = '' }: TimeInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const mouseDownTimeRef = useRef<number>(0);
  const isDraggingRef = useRef(false);

  // 格式化时间函数
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // 解析时间字符串，支持更多格式
  const parseTime = (timeStr: string): number | null => {
    // 移除所有空格
    timeStr = timeStr.trim().replace(/\s+/g, '');
    
    // 尝试不同的格式
    let totalSeconds: number | null = null;

    // 1. 标准格式 "m:ss.mmm"
    const standardPattern = /^(\d+):(\d{1,2})\.(\d{1,3})$/;
    // 2. 无毫秒格式 "m:ss"
    const noMsPattern = /^(\d+):(\d{1,2})$/;
    // 3. 纯秒格式 "ss.mmm"
    const secondsPattern = /^(\d+)\.(\d{1,3})$/;
    // 4. 纯数字格式（解释为秒）
    const numberPattern = /^(\d+)$/;

    if (standardPattern.test(timeStr)) {
      const [, minutes, seconds, milliseconds] = timeStr.match(standardPattern)!;
      totalSeconds = parseInt(minutes) * 60 + 
                    parseInt(seconds) + 
                    parseInt(milliseconds.padEnd(3, '0')) / 1000;
    } else if (noMsPattern.test(timeStr)) {
      const [, minutes, seconds] = timeStr.match(noMsPattern)!;
      totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
    } else if (secondsPattern.test(timeStr)) {
      const [, seconds, milliseconds] = timeStr.match(secondsPattern)!;
      totalSeconds = parseInt(seconds) + 
                    parseInt(milliseconds.padEnd(3, '0')) / 1000;
    } else if (numberPattern.test(timeStr)) {
      totalSeconds = parseInt(timeStr);
    }

    // 验证范围
    if (totalSeconds !== null && totalSeconds >= 0 && totalSeconds <= max) {
      return totalSeconds;
    }
    return null;
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = () => {
    mouseDownTimeRef.current = Date.now();
    isDraggingRef.current = false;
  };

  const handleMouseMove = () => {
    if (mouseDownTimeRef.current) {
      isDraggingRef.current = true;
    }
  };

  const handleMouseUp = () => {
    const mouseUpTime = Date.now();
    const timeDiff = mouseUpTime - mouseDownTimeRef.current;
    
    // 如果鼠标按下时间小于 200ms 且没有拖动，则认为是点击
    if (timeDiff < 200 && !isDraggingRef.current) {
      handleClick();
    }
    
    mouseDownTimeRef.current = 0;
    isDraggingRef.current = false;
  };

  const handleClick = () => {
    setInputValue(formatTime(time));
    setIsEditing(true);
  };

  const handleBlur = () => {
    const parsedTime = parseTime(inputValue);
    if (parsedTime !== null) {
      onChange(parsedTime);
      // 在失焦时格式化显示
      setInputValue(formatTime(parsedTime));
    } else {
      // 如果输入无效，恢复原值
      setInputValue(formatTime(time));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const parsedTime = parseTime(inputValue);
      if (parsedTime !== null) {
        onChange(parsedTime);
        setInputValue(formatTime(parsedTime));
        setIsEditing(false);
      }
    } else if (e.key === 'Escape') {
      setInputValue(formatTime(time));
      setIsEditing(false);
    }
  };

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent w-[84px] text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500/20 rounded px-1.5 py-0.5"
          placeholder="0:00.000"
        />
      ) : (
        <span 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="inline-block min-w-[84px] px-1.5 py-0.5 cursor-text hover:bg-slate-100/50 rounded transition-colors"
        >
          {formatTime(time)}
        </span>
      )}
    </div>
  );
} 