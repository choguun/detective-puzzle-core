"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useGame } from "@/lib/game-context";
import useGameplay from "@/lib/use-gameplay";
import NarrativeDisplay from "./NarrativeDisplay";

export default function DetectiveNotebook() {
  const { gameState } = useGame();
  const { playerNotes, allClues, gameCompleted } = gameState;
  
  const { 
    narrativeContent,
    isGeneratingNarrative,
    handleUpdateNotes,
    handleGenerateProgression,
    handleSolveCase,
    gameplayState
  } = useGameplay();
  
  const [activeTab, setActiveTab] = useState<'notes' | 'connections' | 'analysis'>('notes');
  const [autoSave, setAutoSave] = useState<NodeJS.Timeout | null>(null);
  
  // Get all discovered clues
  const discoveredClues = allClues.filter(clue => clue.discovered);
  const examinedClues = allClues.filter(clue => clue.examined);

  // Auto-save notes
  useEffect(() => {
    if (autoSave) {
      clearTimeout(autoSave);
    }
    
    const timer = setTimeout(() => {
      if (playerNotes.trim() !== "") {
        // Visual feedback that notes are saved could be added here
        console.log("Auto-saving notes...");
      }
    }, 2000);
    
    setAutoSave(timer);
    
    return () => {
      if (autoSave) clearTimeout(autoSave);
    };
  }, [playerNotes]);
  
  // Handle showing the analysis tab when content is generated
  useEffect(() => {
    if (gameplayState.narrativeFocus === 'analysis' || gameplayState.narrativeFocus === 'conclusion') {
      setActiveTab('analysis');
    }
  }, [gameplayState.narrativeFocus]);

  // Handle note updates
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleUpdateNotes(e.target.value);
  };

  return (
    <Card className="w-full border-t-4 border-t-primary shadow-lg overflow-hidden">
      <CardHeader className="bg-muted/50 pb-2">
        <CardTitle className="flex items-center justify-between text-xl">
          <span className="flex items-center">
            <span className="mr-2">📓</span>
            Detective&apos;s Notebook
          </span>
          <div className="flex text-sm font-normal space-x-1">
            <Button 
              variant={activeTab === 'notes' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setActiveTab('notes')}
              className="text-xs h-8"
            >
              Notes
            </Button>
            <Button 
              variant={activeTab === 'connections' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setActiveTab('connections')}
              className="text-xs h-8"
              disabled={examinedClues.length < 2}
            >
              Evidence Board
            </Button>
            <Button 
              variant={activeTab === 'analysis' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setActiveTab('analysis')}
              className="text-xs h-8"
              disabled={gameplayState.narrativeFocus !== 'analysis' && gameplayState.narrativeFocus !== 'conclusion'}
            >
              Analysis
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="p-4 space-y-4">
            {/* Discovered Clues */}
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <span className="mr-2">🔍</span>
                Discovered Evidence ({discoveredClues.length}/{allClues.length})
              </h3>
              <div className="flex flex-wrap gap-2 pb-2 border-b">
                {discoveredClues.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No evidence discovered yet. Search the scene carefully.</p>
                ) : (
                  discoveredClues.map((clue) => (
                    <HoverCard key={clue.id}>
                      <HoverCardTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`
                            ${clue.examined ? "border-primary bg-primary/5" : ""}
                            evidence-tag
                          `}
                        >
                          {clue.name}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">{clue.name}</h4>
                          <p className="text-sm">{clue.description}</p>
                          {clue.examined && (
                            <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                              <span className="font-semibold">Status:</span> Thoroughly examined
                            </p>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ))
                )}
              </div>
            </div>

            {/* Detective's Notes */}
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <span className="mr-2">✏️</span>
                Your Case Notes
              </h3>
              <Textarea
                placeholder="Take notes about the case here... What connections do you see between the clues? What theories are you developing?"
                className="min-h-[200px] notebook-paper p-4 leading-relaxed"
                value={playerNotes}
                onChange={handleNotesChange}
              />
              <p className="text-xs text-muted-foreground mt-1">Notes auto-save as you type...</p>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleGenerateProgression}
                disabled={discoveredClues.length === 0 || isGeneratingNarrative || gameplayState.narrativeFocus === 'analysis'}
                className="flex items-center"
              >
                <span className="mr-2">🔎</span>
                Analyze Evidence
              </Button>
              
              <Button
                onClick={handleSolveCase}
                disabled={examinedClues.length < 3 || gameCompleted || isGeneratingNarrative || gameplayState.narrativeFocus === 'conclusion'}
                className="bg-primary hover:bg-primary/90 flex items-center"
              >
                <span className="mr-2">🎯</span>
                Solve the Case
              </Button>
            </div>
          </div>
        )}
        
        {/* Connections Tab - Simple Evidence Board Visualization */}
        {activeTab === 'connections' && (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <span className="mr-2">🔗</span>
              Evidence Connections
            </h3>
            
            <div className="crime-scene-tape h-[400px] relative p-8 bg-muted/30 rounded-lg overflow-auto">
              {examinedClues.length < 2 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Examine at least two pieces of evidence to see connections.</p>
                </div>
              ) : (
                <>
                  {/* Evidence cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {examinedClues.map(clue => (
                      <div
                        key={clue.id} 
                        id={`clue-${clue.id}`}
                        className="bg-white dark:bg-black/60 p-3 rounded-md shadow-md border border-muted transform rotate-[-1deg] hover:rotate-0 transition-transform duration-200"
                      >
                        <h4 className="font-bold text-sm">{clue.name}</h4>
                        <p className="text-xs mt-1">{clue.description}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* SVG for connection lines - simplified representation */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg width="100%" height="100%" className="absolute inset-0">
                      {gameplayState.connectionLines.map((connection, idx) => {
                        // In a full implementation, you would calculate actual element positions
                        // This is just a simplified visual representation
                        return (
                          <g key={idx}>
                            <line 
                              x1={`${20 + Math.random() * 30}%`} 
                              y1={`${20 + Math.random() * 30}%`} 
                              x2={`${50 + Math.random() * 30}%`} 
                              y2={`${50 + Math.random() * 30}%`} 
                              stroke="red" 
                              strokeDasharray="5,5" 
                              strokeWidth="1"
                            />
                            <text 
                              x={`${35 + Math.random() * 15}%`} 
                              y={`${35 + Math.random() * 15}%`} 
                              fill="black" 
                              fontSize="10" 
                              textAnchor="middle"
                              className="bg-white px-1"
                            >
                              {connection.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 italic">
              Note: This is your evidence board. The connections shown are based on your investigation so far.
            </p>
          </div>
        )}
        
        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="p-4 space-y-4">
            {/* Story Progression or Conclusion */}
            <div className="border rounded-md p-4 vintage-paper">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <span className="mr-2">{gameplayState.narrativeFocus === 'conclusion' ? '🏆' : '📊'}</span>
                {gameplayState.narrativeFocus === 'conclusion' ? 'Case Conclusion' : 'Case Analysis'}
              </h3>
              <NarrativeDisplay
                content={narrativeContent}
                isLoading={isGeneratingNarrative}
                highlightTerms={["suspect", "evidence", "connection", "theory", "motive", "opportunity"]}
              />
            </div>
            
            {/* Evidence Summary */}
            <div className="border rounded-md p-4 bg-muted/20">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <span className="mr-2">📋</span>
                Evidence Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {examinedClues.map((clue) => (
                  <div key={clue.id} className="border p-2 rounded bg-card">
                    <h4 className="font-medium text-sm">{clue.name}</h4>
                    <p className="text-xs text-muted-foreground">{clue.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Game Time */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <div>
                Investigation Time: {Math.floor(gameplayState.gameTime / 60)}m {gameplayState.gameTime % 60}s
              </div>
              
              <Button
                variant="outline"
                onClick={() => setActiveTab('notes')}
                size="sm"
              >
                Back to Notes
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 