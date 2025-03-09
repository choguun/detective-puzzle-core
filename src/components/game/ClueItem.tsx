"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useGame } from "@/lib/game-context";
import useGameplay from "@/lib/use-gameplay";
import { Clue } from "@/lib/game-context";
import NarrativeDisplay from "./NarrativeDisplay";

interface ClueItemProps {
  clue: Clue;
  onDiscover: () => void;
}

export default function ClueItem({ clue, onDiscover }: ClueItemProps) {
  const { gameState } = useGame();
  const { allClues } = gameState;
  
  const { 
    narrativeContent, 
    isGeneratingNarrative, 
    handleExamineClue,
    gameplayState 
  } = useGameplay();
  
  const [isHovered, setIsHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(!clue.discovered);
  const [showDialogContent, setShowDialogContent] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const dialogRef = useRef<HTMLButtonElement>(null);
  const isActiveClue = gameplayState.activeClueId === clue.id;

  // Pulse effect for undiscovered clues
  useEffect(() => {
    const pulseTiming = setTimeout(() => {
      setShowPulse(clue.discovered ? false : !showPulse);
    }, 2000);
    
    return () => clearTimeout(pulseTiming);
  }, [showPulse, clue.discovered]);
  
  // Show content whenever the dialog is opened
  useEffect(() => {
    if (isDialogOpen) {
      setShowDialogContent(true);
    }
  }, [isDialogOpen]);

  // Handle examining a clue
  const handleExamineClueClick = async () => {
    // Discovery feedback
    if (!clue.discovered) {
      // Show discovery animation
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 1000);
      
      onDiscover();
    }
    
    // Examine the clue via our gameplay hook
    handleExamineClue(clue.id);
    setShowDialogContent(true);
    setIsDialogOpen(true);
  };

  // Enhanced button text
  const getButtonText = () => {
    if (!clue.discovered) return "Investigate Object";
    if (!clue.examined) return "Examine Closely";
    return "Review Evidence";
  };

  return (
    <Card 
      className={`
        ${clue.discovered ? "opacity-100" : "opacity-85 hover:opacity-100"}
        ${showPulse && !clue.discovered ? "clue-highlight" : ""}
        ${isActiveClue ? "ring-2 ring-primary" : ""}
        transition-all duration-300 relative overflow-hidden
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!clue.discovered && isHovered && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center animate-pulse">
            <span className="text-white text-lg">🔍</span>
          </div>
        </div>
      )}
      
      {clue.discovered && !clue.examined && (
        <div className="absolute top-0 right-0 w-5 h-5 bg-yellow-400 rounded-full m-2 animate-pulse" />
      )}
      
      {clue.examined && (
        <div className="absolute top-0 right-0 w-5 h-5 bg-green-500 rounded-full m-2" />
      )}
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          {clue.discovered ? clue.name : "Unknown Object"}
          {clue.examined && (
            <span className="ml-auto text-xs bg-primary/10 px-2 py-1 rounded-full">
              Examined
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground">
          {clue.discovered 
            ? clue.description 
            : "This object might contain valuable information."}
        </p>
      </CardContent>
      
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild ref={dialogRef}>
            <Button 
              variant={clue.examined ? "outline" : "default"}
              onClick={handleExamineClueClick}
              className={`
                w-full
                ${!clue.discovered ? "magnifying-cursor" : ""}
                ${clue.examined ? "border-primary/50" : ""}
              `}
            >
              {!clue.discovered && <span className="mr-2">🔍</span>}
              {getButtonText()}
            </Button>
          </DialogTrigger>
          
          {showDialogContent && (
            <DialogContent className="max-w-2xl">
              <DialogHeader className="border-b pb-2">
                <DialogTitle className="flex items-center">
                  <span>{clue.name}</span>
                  {clue.examined && (
                    <span className="ml-auto text-xs bg-primary/10 px-2 py-1 rounded-full">
                      Evidence #{allClues.filter(c => c.examined).findIndex(c => c.id === clue.id) + 1}
                    </span>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="mt-4 space-y-4">
                <div className="p-2 border rounded-md bg-secondary/30">
                  <h4 className="text-sm font-medium mb-1">Basic Description:</h4>
                  <p className="text-sm text-muted-foreground">{clue.description}</p>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Detective&apos;s Analysis:</h4>
                  <NarrativeDisplay 
                    content={isActiveClue ? narrativeContent : clue.content || "Examining this clue closely..."}
                    isLoading={isGeneratingNarrative && isActiveClue}
                    highlightTerms={["important", "connection", "hint", "clue", "sign", "suspicious"]}
                  />
                </div>
                
                <div className="flex justify-end pt-2">
                  <DialogClose asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowDialogContent(false);
                        // Force a small delay before closing to ensure animations complete
                        setTimeout(() => setIsDialogOpen(false), 100);
                      }}
                    >
                      Close
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </CardFooter>
    </Card>
  );
} 