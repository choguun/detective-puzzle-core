"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGame } from "@/lib/game-context";
import { useTheme } from "next-themes";
import GameScene from "./GameScene";
import DetectiveNotebook from "./DetectiveNotebook";

export default function GameLayout() {
  const { gameState, startGame, resetGame } = useGame();
  const { gameStarted, gameCompleted, gameProgress } = gameState;
  const { theme, setTheme } = useTheme();
  
  const [showNotebook, setShowNotebook] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [ambientSoundEnabled, setAmbientSoundEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set theme handling with next-themes
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle starting a new game
  const handleStartGame = () => {
    startGame();
  };

  // Handle resetting the game
  const handleResetGame = () => {
    resetGame();
  };

  // Toggle notebook visibility
  const toggleNotebook = () => {
    setShowNotebook(!showNotebook);
  };
  
  // Instructions dialog
  const renderInstructions = () => (
    <div className="space-y-4 text-sm">
      <h3 className="text-lg font-bold">How to Play</h3>
      <p>Welcome, Detective. Your mission is to solve the mystery by collecting and analyzing evidence.</p>
      
      <div className="space-y-2">
        <h4 className="font-semibold">Game Mechanics:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Explore different scenes to discover clues</li>
          <li>Click on objects to investigate them closely</li>
          <li>Examine clues to gather important information</li>
          <li>Take notes in your detective notebook</li>
          <li>Analyze your findings to make connections</li>
          <li>Solve the case when you feel confident</li>
        </ul>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-semibold">Tips:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Pay close attention to details in scene descriptions</li>
          <li>Take thorough notes of your observations</li>
          <li>Look for connections between different pieces of evidence</li>
          <li>You need to examine at least 3 clues before solving the case</li>
        </ul>
      </div>
    </div>
  );

  // Don't render with hydration mismatch
  if (!mounted) return null;

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20 z-0" 
          style={{backgroundImage: "url('/images/detective-background.jpg')"}}></div>
        <div className="absolute inset-0 bg-black/70 z-0"></div>
        
        <div className="max-w-2xl text-center space-y-8 z-10 relative">
          <div className="mb-8 relative">
            <h1 className="text-5xl font-bold mb-4 text-primary font-serif">
              Mystery Room
            </h1>
            <h2 className="text-3xl font-serif">The Detective&apos;s Case</h2>
            <div className="mt-4 w-20 h-1 bg-primary mx-auto"></div>
          </div>
          
          <p className="text-xl">
            You are a detective called to investigate a mysterious case. 
            Explore the scene, discover clues, and solve the mystery.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" onClick={handleStartGame} className="bg-primary hover:bg-primary/90">
              Begin Investigation
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline">
                  Instructions
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Detective&apos;s Handbook</DialogTitle>
                </DialogHeader>
                {renderInstructions()}
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="pt-8 flex items-center justify-center gap-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? '🌞 Light Mode' : '🌙 Dark Mode'}
            </Button>
          </div>
        </div>
        
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
          Created for Mystery Game Hackathon
        </div>
      </div>
    );
  }

  if (gameCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-10 z-0" 
          style={{backgroundImage: "url('/images/detective-success.jpg')"}}></div>
        
        <div className="max-w-3xl text-center space-y-6 z-10 relative">
          <div className="inline-block bg-primary/20 p-4 rounded-full mb-4">
            <div className="text-5xl">🏆</div>
          </div>
          
          <h1 className="text-4xl font-bold font-serif">Case Closed</h1>
          <p className="text-xl">
            Congratulations, detective! You have successfully solved the case.
          </p>
          
          <div className="flex justify-center gap-4 pt-4">
            <Button variant="outline" onClick={toggleNotebook}>
              {showNotebook ? "Hide" : "View"} Case Files
            </Button>
            <Button onClick={handleResetGame} className="bg-primary hover:bg-primary/90">
              Start New Case
            </Button>
          </div>
          
          {showNotebook && (
            <div className="mt-8 w-full max-w-3xl mx-auto">
              <DetectiveNotebook />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 relative min-h-screen">
      {/* Atmospheric overlay for dark mode */}
      {theme === 'dark' && (
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-gray-900 to-black opacity-40 pointer-events-none z-0"></div>
      )}
      
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 z-10 relative">
        <div className="flex items-center">
          <h2 className="text-xl font-bold hidden sm:inline-block mr-4 font-serif">Mystery Room</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowInstructions(true)}
            className="text-sm"
          >
            Instructions
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-sm hidden sm:flex"
          >
            {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAmbientSoundEnabled(!ambientSoundEnabled)}
            className="text-sm hidden sm:flex"
          >
            {ambientSoundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
          </Button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2.5 relative z-10">
        <div 
          className="bg-primary h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${gameProgress}%` }}
        ></div>
        <div className="absolute -top-7 right-0 text-xs">
          Case Progress: {gameProgress}%
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 z-10 relative">
        {/* Game Scene */}
        <div className={`${showNotebook ? "lg:w-1/2" : "w-full"} transition-all duration-300`}>
          <GameScene />
        </div>
        
        {/* Detective's Notebook */}
        {showNotebook && (
          <div className="lg:w-1/2">
            <DetectiveNotebook />
          </div>
        )}
      </div>
      
      {/* Notebook Toggle */}
      <div className="fixed bottom-6 right-6 z-20">
        <Button 
          onClick={toggleNotebook}
          variant="outline"
          className="rounded-full w-14 h-14 flex items-center justify-center shadow-lg border-2"
          title={showNotebook ? "Close Notebook" : "Open Detective's Notebook"}
        >
          {showNotebook ? '📕' : '📖'}
        </Button>
      </div>
      
      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detective&apos;s Handbook</DialogTitle>
          </DialogHeader>
          {renderInstructions()}
        </DialogContent>
      </Dialog>
    </div>
  );
} 