"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clue } from "@/lib/game-context";
import { Card } from "@/components/ui/card";
import Spinner from "../ui/spinner";

// Puzzle types available in the game
type PuzzleType = "sequence" | "connection" | "code";

interface PuzzleConfig {
  type: PuzzleType;
  title: string;
  description: string;
  data: Record<string, any>;
  solution: any;
}

interface MiniPuzzleProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  sceneId: string;
  clues: Clue[];
}

// Puzzle configurations for each scene
const SCENE_PUZZLES: Record<string, PuzzleConfig> = {
  "study": {
    type: "sequence",
    title: "Sequence Puzzle: The Professor's Timeline",
    description: "Arrange the clues in the correct chronological order to understand the professor's activities leading up to the incident.",
    data: {
      items: ["drawer", "painting", "letters", "bookshelf", "paperweight"]
    },
    solution: ["letters", "bookshelf", "painting", "drawer", "paperweight"]
  },
  "library": {
    type: "connection",
    title: "Connection Puzzle: The Hidden Message",
    description: "Connect the related clues to reveal a hidden message in the library. Each pair of clues is connected in some way.",
    data: {
      pairs: [
        ["book", "desk"],
        ["window", "catalog"],
        ["floorboard", "book"]
      ]
    },
    solution: [
      ["book", "catalog"],
      ["window", "floorboard"],
      ["desk", "book"]
    ]
  },
  "basement": {
    type: "code",
    title: "Code Puzzle: Decrypt the Symbols",
    description: "Use the clues you've found to decrypt the coded message on the wall. Each clue provides part of the decryption key.",
    data: {
      code: "XMTPH RFKGJ QWDSB",
      hints: {
        "symbols": "First letter is 'T'",
        "lockbox": "Shift each letter 3 positions",
        "photograph": "Every second letter is significant",
        "equipment": "Read backwards for clarity",
        "journal": "The final key is 'TRUTH'"
      }
    },
    solution: "TRUTH"
  }
};

export default function MiniPuzzle({ open, onClose, onComplete, sceneId, clues }: MiniPuzzleProps) {
  const [userSolution, setUserSolution] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [puzzleData, setPuzzleData] = useState<PuzzleConfig | null>(null);
  const [selectedClue, setSelectedClue] = useState<string | null>(null); // Used for connection puzzle
  
  // Reset state when a new puzzle opens
  useEffect(() => {
    if (open) {
      setUserSolution(null);
      setFeedback(null);
      setIsCorrect(false);
      
      // Get puzzle for this scene
      const puzzle = SCENE_PUZZLES[sceneId];
      if (puzzle) {
        setPuzzleData(puzzle);
        
        // Initialize user solution based on puzzle type
        if (puzzle.type === "sequence") {
          // Randomize the order for sequence puzzles
          setUserSolution([...puzzle.data.items].sort(() => Math.random() - 0.5));
        } else if (puzzle.type === "connection") {
          setUserSolution([]);
        } else if (puzzle.type === "code") {
          setUserSolution("");
        }
      }
    }
  }, [open, sceneId]);

  // Handle submitting a solution
  const handleSubmit = () => {
    if (!puzzleData || !userSolution) return;
    
    setIsSubmitting(true);
    setFeedback(null);
    
    // Simulate processing time for effect
    setTimeout(() => {
      let correct = false;
      
      // Check solution based on puzzle type
      if (puzzleData.type === "sequence") {
        // Check if the sequence matches the solution
        correct = JSON.stringify(userSolution) === JSON.stringify(puzzleData.solution);
      } else if (puzzleData.type === "connection") {
        // Check if all connections are correct
        correct = puzzleData.solution.every((pair: string[]) => 
          userSolution.some((userPair: string[]) => 
            (userPair[0] === pair[0] && userPair[1] === pair[1]) || 
            (userPair[0] === pair[1] && userPair[1] === pair[0])
          )
        );
      } else if (puzzleData.type === "code") {
        // Check if the code is correct (case insensitive)
        correct = userSolution.toUpperCase() === puzzleData.solution;
      }
      
      if (correct) {
        setIsCorrect(true);
        setFeedback("Excellent work, detective! You've solved the puzzle and unlocked the next scene.");
        
        // Allow time to read the success message before closing
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setFeedback("That's not quite right. Review the clues again and try a different approach.");
      }
      
      setIsSubmitting(false);
    }, 1500);
  };

  // Helper to render the sequence puzzle
  const renderSequencePuzzle = () => {
    if (!puzzleData || !userSolution) return null;
    
    const moveItem = (index: number, direction: "up" | "down") => {
      const newSolution = [...userSolution];
      
      if (direction === "up" && index > 0) {
        [newSolution[index], newSolution[index - 1]] = [newSolution[index - 1], newSolution[index]];
      } else if (direction === "down" && index < newSolution.length - 1) {
        [newSolution[index], newSolution[index + 1]] = [newSolution[index + 1], newSolution[index]];
      }
      
      setUserSolution(newSolution);
    };
    
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-400">Drag items or use the arrows to arrange the clues in chronological order.</p>
        
        <div className="space-y-2">
          {userSolution.map((clueId: string, index: number) => {
            const clue = clues.find(c => c.id === clueId);
            return (
              <div key={clueId} className="flex items-center space-x-2">
                <div className="bg-gray-700 text-white w-8 h-8 flex items-center justify-center rounded-full">
                  {index + 1}
                </div>
                <Card className="flex-1 p-3 bg-gray-800">
                  <div className="font-medium">{clue?.name || clueId}</div>
                </Card>
                <div className="flex flex-col">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-6" 
                    onClick={() => moveItem(index, "up")}
                    disabled={index === 0}
                  >
                    ▲
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-6" 
                    onClick={() => moveItem(index, "down")}
                    disabled={index === userSolution.length - 1}
                  >
                    ▼
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper to render the connection puzzle
  const renderConnectionPuzzle = () => {
    if (!puzzleData || !userSolution) return null;
    
    const allClueIds = [...new Set(puzzleData.data.pairs.flat())];
    
    const handleClueClick = (clueId: string) => {
      if (!selectedClue) {
        setSelectedClue(clueId);
      } else if (selectedClue !== clueId) {
        // Create a new connection
        const newPair = [selectedClue, clueId];
        setUserSolution([...userSolution, newPair]);
        setSelectedClue(null);
      }
    };
    
    const removeConnection = (index: number) => {
      const newSolution = [...userSolution];
      newSolution.splice(index, 1);
      setUserSolution(newSolution);
    };
    
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-400">Connect related clues by clicking on two clues in sequence.</p>
        
        <div className="grid grid-cols-3 gap-2">
          {allClueIds.map((clueId) => {
            const clue = clues.find(c => c.id === clueId);
            return (
              <Button 
                key={clueId}
                variant={selectedClue === clueId ? "default" : "outline"} 
                className="p-2 h-auto"
                onClick={() => handleClueClick(clueId)}
              >
                {clue?.name || clueId}
              </Button>
            );
          })}
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Your Connections:</h4>
          {userSolution.length === 0 ? (
            <p className="text-sm text-gray-400">No connections made yet.</p>
          ) : (
            <div className="space-y-2">
              {userSolution.map((pair: string[], index: number) => {
                const clue1 = clues.find(c => c.id === pair[0]);
                const clue2 = clues.find(c => c.id === pair[1]);
                return (
                  <div key={index} className="flex items-center">
                    <div className="flex-1 text-sm">
                      {clue1?.name || pair[0]} ↔️ {clue2?.name || pair[1]}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={() => removeConnection(index)}
                    >
                      ✕
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper to render the code puzzle
  const renderCodePuzzle = () => {
    if (!puzzleData || puzzleData.type !== "code") return null;
    
    const { code, hints } = puzzleData.data;
    
    return (
      <div className="space-y-4">
        <div className="p-4 bg-gray-700 rounded text-center">
          <div className="text-lg font-mono font-bold tracking-widest">
            {code}
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Clue Hints:</h4>
          {Object.entries(hints).map(([clueId, hint]) => {
            const clue = clues.find(c => c.id === clueId);
            return (
              <div key={clueId} className="text-sm">
                <span className="font-medium">{clue?.name || clueId}:</span> {hint}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Your Solution:</label>
          <input
            type="text"
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded"
            value={userSolution}
            onChange={(e) => setUserSolution(e.target.value)}
            placeholder="Enter the decoded message..."
          />
        </div>
      </div>
    );
  };

  if (!puzzleData) return null;

  return (
    <Dialog open={open} onOpenChange={isCorrect ? () => {} : onClose}>
      <DialogContent className="bg-gray-900 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>{puzzleData.title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p>{puzzleData.description}</p>
          
          {/* Render different puzzle types */}
          {puzzleData.type === "sequence" && renderSequencePuzzle()}
          {puzzleData.type === "connection" && renderConnectionPuzzle()}
          {puzzleData.type === "code" && renderCodePuzzle()}
          
          {/* Feedback message */}
          {feedback && (
            <div className={`p-3 rounded ${isCorrect ? 'bg-green-700/50' : 'bg-red-700/50'}`}>
              {feedback}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isCorrect}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {isSubmitting ? <Spinner size="sm" /> : "Submit Solution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 