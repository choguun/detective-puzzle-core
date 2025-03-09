'use client';

import { GameProvider } from "@/lib/game-context";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import GameScene from "@/components/game/GameScene";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GamePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check for authentication (in a real app, verify token/session)
  useEffect(() => {
    setMounted(true);
    
    // Check if authenticated from localStorage
    const walletAuth = localStorage.getItem('wallet_authenticated');
    
    if (walletAuth) {
      setIsAuthenticated(true);
    } else {
      // Redirect to landing page if not authenticated
      router.push('/');
    }
  }, [router]);

  // Show loading state during SSR and initial client render
  if (!mounted || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <ThemeProvider attribute="class" defaultTheme="dark">
        <GameProvider>
          <GameScene />
          <Toaster />
        </GameProvider>
      </ThemeProvider>
    </main>
  );
} 