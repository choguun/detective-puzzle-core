'use client';

import React, { useState } from 'react';
import { LeaderboardComponent } from '@/lib/leaderboard-contract';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [mounted, setMounted] = useState(false);
  
  // Only render after client-side hydration
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse bg-slate-800 rounded-lg w-full max-w-2xl h-[500px]"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Detective Puzzle Leaderboard</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
        
        <div className="space-y-8">
          <div className="p-6 bg-slate-800/50 rounded-lg shadow-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Top Detectives</h2>
            <p className="text-slate-300 mb-6">
              This leaderboard shows the top players in the Detective Puzzle game. 
              Scores are calculated based on game completion time, clues found, and game completion status.
            </p>
            <p className="text-amber-400 text-sm">
              Connect your wallet and play the game to appear on the leaderboard!
            </p>
          </div>
          
          <LeaderboardComponent />
          
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-2">How Scoring Works</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
              <li>Base points for completing the game</li>
              <li>Bonus points for finding all clues</li>
              <li>Time multiplier - faster completion means higher scores</li>
              <li>Special achievements for solving puzzles efficiently</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
} 