"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGame } from "@/lib/game-context";
import { useTheme } from "next-themes";
import GameScene from "./GameScene";
import DetectiveNotebook from "./DetectiveNotebook";
import TutorialOverlay from "./TutorialOverlay";
import HelpMenu from "./HelpMenu";
import GameWalletAuth from "./GameWalletAuth";
import GameWeb3Connector from "./GameWeb3Connector";

export default function GameLayout() {
  const { 
    isGameStarted, 
    startGame, 
    isTutorialCompleted,
    completeTutorial
  } = useGame();
  
  const { theme, setTheme } = useTheme();
  
  const [showNotebook, setShowNotebook] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [ambientSoundEnabled, setAmbientSoundEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isWalletAuthenticated, setIsWalletAuthenticated] = useState(false);

  // Set theme handling with next-themes
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if tutorial was completed before
  useEffect(() => {
    if (isGameStarted && !isTutorialCompleted) {
      setShowTutorial(true);
    }
  }, [isGameStarted, isTutorialCompleted]);

  // Handle starting a new game
  const handleStartGame = () => {
    startGame();
  };

  // Toggle notebook visibility
  const toggleNotebook = () => {
    setShowNotebook(!showNotebook);
  };

  const handleWalletAuthenticated = () => {
    setIsWalletAuthenticated(true);
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
          <li>Take actions to investigate objects in the scene</li>
          <li>Each scene contains 5 hidden clues to discover</li>
          <li>Take notes in your detective notebook</li>
          <li>Complete a scene by finding all its clues</li>
          <li>Explore all scenes to solve the case</li>
        </ul>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-semibold">Tips:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Pay close attention to details in scene descriptions</li>
          <li>Be specific in your actions (e.g., &quot;examine the desk&quot; rather than just &quot;look&quot;)</li>
          <li>Use the hints feature if you get stuck</li>
          <li>Complete all scenes to solve the mystery</li>
        </ul>
      </div>
    </div>
  );

  // Handle tutorial completion
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    completeTutorial();
  };
  
  // Add a function to manually show the tutorial
  const handleShowTutorial = () => {
    setShowTutorial(true);
  };

  // Don't render with hydration mismatch
  if (!mounted) return null;

  if (!isGameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 relative overflow-hidden h-screen">
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
          {!isWalletAuthenticated ? (
            <div className="bg-slate-900/80 p-8 rounded-lg border border-slate-700">
            <h2 className="text-2xl font-semibold text-white mb-4">Authentication Required</h2>
            <p className="text-slate-300 mb-6">
              Connect your wallet and sign a message to prove your identity before starting the investigation.
            </p>
            <GameWalletAuth 
              onAuthenticated={handleWalletAuthenticated} 
              isGameStarted={false}
            />
          </div>
        ) : (
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
        )}
          
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

  return (
    <div className="min-h-screen flex flex-col">
      <GameWeb3Connector />
      
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
            <GameWalletAuth 
              onAuthenticated={handleWalletAuthenticated}
              isGameStarted={true}
            />
          </div>
          <div className="flex items-center gap-2">
            <HelpMenu onStartTutorial={handleShowTutorial} />
            
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
            style={{ width: `0%` }}
          ></div>
          <div className="absolute -top-7 right-0 text-xs">
            Case Progress: Investigating...
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 z-10 relative">
          {/* Game Scene */}
          <div className={`${showNotebook ? "lg:w-1/2" : "w-full"} transition-all duration-300`}>
            <GameScene />
          </div>
          
          {/* Detective's Notebook */}
          {showNotebook && (
            <div className="lg:w-1/2 h-[700px] overflow-auto">
              <DetectiveNotebook />
            </div>
          )}
        </div>
        
        {/* Bottom Actions */}
        <div className="flex justify-between items-center z-10 relative">
          <Button 
            variant="outline" 
            onClick={toggleNotebook}
            className="flex-shrink-0"
            id="notebook-toggle"
          >
            {showNotebook ? "Hide Notebook" : "View Notebook"}
          </Button>
          
          <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Detective&apos;s Handbook</DialogTitle>
              </DialogHeader>
              {renderInstructions()}
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Tutorial Overlay */}
        {showTutorial && (
          <TutorialOverlay onComplete={handleTutorialComplete} />
        )}
      </div>
    </div>
  );
} 