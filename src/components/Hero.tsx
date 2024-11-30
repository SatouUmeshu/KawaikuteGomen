'use client';
import React from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

export function Hero() {
  const router = useRouter();

  return (
    <div className="relative w-full lg:absolute lg:left-0 lg:top-0 lg:w-[45%] h-full z-30 p-6 lg:p-12 flex items-center bg-background/90 lg:bg-transparent">
      <div className="w-full">
        <h1 className="text-4xl lg:text-6xl font-bold mb-4 lg:mb-6">Kawaikute Gomen</h1>
        <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-8">
          Kawaikute Gomen is an open-source Otaku Dance control tool.
        </p>
        
        <Button 
          size="lg" 
          className="rounded-lg relative"
          onClick={() => router.push('/panel')}
        >
          Try Kawaikute Gomen now
        </Button>
      </div>
    </div>
  );
}
