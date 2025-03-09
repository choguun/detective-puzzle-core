"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useGame } from "@/lib/game-context";
import { Clue } from "@/lib/game-context";

interface ClueItemProps {
  clue: Clue;
  onDiscover: () => void;
}

export default function ClueItem({ clue, onDiscover }: ClueItemProps) {
  const { clues } = useGame();
  
  const [isHovered, setIsHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(!clue.discovered);
  const [showDialogContent, setShowDialogContent] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const dialogRef = useRef<HTMLButtonElement>(null);

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
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 1000);
      onDiscover();
    }

    setShowDialogContent(true);
    setIsDialogOpen(true);
  };

  // Get index of this clue in the discovered clues
  const getClueIndex = () => {
    const discoveredClues = clues.filter(c => c.discovered);
    return discoveredClues.findIndex(c => c.id === clue.id) + 1;
  };

  return (
    <Card 
      className={`
        ${clue.discovered ? "opacity-100" : "opacity-85 hover:opacity-100"}
        ${showPulse && !clue.discovered ? "clue-highlight" : ""}
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
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          {clue.discovered ? clue.name : "Unknown Object"}
          {clue.discovered && (
            <span className="ml-auto text-xs bg-primary/10 px-2 py-1 rounded-full">
              Evidence #{getClueIndex()}
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
              variant="default"
              onClick={handleExamineClueClick}
              className={`
                w-full
                ${!clue.discovered ? "magnifying-cursor" : ""}
              `}
            >
              {!clue.discovered && <span className="mr-2">🔍</span>}
              {clue.discovered ? "View Details" : "Investigate Object"}
            </Button>
          </DialogTrigger>
          
          {showDialogContent && (
            <DialogContent className="max-w-2xl">
              <DialogHeader className="border-b pb-2">
                <DialogTitle className="flex items-center">
                  <span>{clue.name}</span>
                  <span className="ml-auto text-xs bg-primary/10 px-2 py-1 rounded-full">
                    Evidence #{getClueIndex()}
                  </span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="mt-4 space-y-4">
                <div className="p-2 border rounded-md bg-secondary/30">
                  <h4 className="text-sm font-medium mb-1">Description:</h4>
                  <p className="text-sm text-muted-foreground">{clue.description}</p>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Detective&apos;s Notes:</h4>
                  <p className="text-sm">
                    This evidence was found in the {clue.sceneId}. It could be connected to the case.
                  </p>
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