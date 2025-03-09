'use client';

import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import Image from 'next/image';
// import { Button } from '@/components/ui/button';
// import GameWalletAuth from '@/components/game/GameWalletAuth';
import { GameProvider } from '@/lib/game-context';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import GameLayout from '@/components/game/GameLayout';
import Link from 'next/link';

export default function LandingPage() {
  // const router = useRouter();
  // const [isWalletAuthenticated, setIsWalletAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state on client-side
  useEffect(() => {
    setMounted(true);
    
    // Check if already authenticated
    // const isAuthenticated = localStorage.getItem('wallet_authenticated');
    // if (isAuthenticated) {
    //   setIsWalletAuthenticated(true);
    // }
  }, []);
  
  // const handleWalletAuthenticated = () => {
  //   setIsWalletAuthenticated(true);
  // };
  
  // const startGame = () => {
  //   router.push('/game');
  // };

  // Don't render wallet components during SSR
  if (!mounted) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black" />
        </div>
        <div className="z-10 animate-pulse bg-slate-800 rounded-lg w-full max-w-3xl h-[400px]"></div>
        <div className="text-slate-400 text-sm mt-10">
          <p>A next-generation detective game powered by AI with wallet authentication.</p>
          <div className="mt-2 flex flex-wrap gap-4 justify-center">
            <Link href="/wallet-examples" className="text-blue-400 hover:underline">
              View On-Chain Transaction Examples →
            </Link>
            <Link href="/leaderboard" className="text-amber-400 hover:underline">
              Check Game Leaderboard →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <ThemeProvider attribute="class" defaultTheme="dark">
        <GameProvider>
          <GameLayout />
          <Toaster />
        </GameProvider>
      </ThemeProvider>
    </main>
  );
}
