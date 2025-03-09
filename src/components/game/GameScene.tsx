"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import useGameplay from "@/lib/use-gameplay";
import { Clue } from "@/lib/game-context";
import ClueItem from "./ClueItem";
import NarrativeDisplay from "./NarrativeDisplay";

export default function GameScene() {
  // Use our enhanced gameplay hook instead of directly accessing context
  const { 
    currentScene, 
    allClues,
    allScenes,
    gameplayState,
    narrativeContent,
    isGeneratingNarrative,
    handleDiscoverClue: discoverClue,
    handleChangeScene: changeScene,
    generateSceneNarrative
  } = useGameplay();
  
  const [imageError, setImageError] = useState<boolean>(false);
  const [visibleClues, setVisibleClues] = useState<Clue[]>([]);
  const [showHints, setShowHints] = useState<boolean>(false);
  const sceneBgRef = useRef<HTMLDivElement>(null);

  // Get the clues available in the current scene
  useEffect(() => {
    const cluesInScene = allClues.filter(clue => 
      currentScene.availableClues.includes(clue.id)
    );
    setVisibleClues(cluesInScene);
  }, [currentScene, allClues]);

  // Add parallax effect to scene background on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sceneBgRef.current && !imageError) {
        const { left, top, width, height } = sceneBgRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        
        sceneBgRef.current.style.transform = `
          perspective(1000px)
          rotateY(${x * 2}deg)
          rotateX(${y * -2}deg)
          scale(1.03)
        `;
      }
    };
    
    const handleMouseLeave = () => {
      if (sceneBgRef.current) {
        sceneBgRef.current.style.transform = `
          perspective(1000px)
          rotateY(0deg)
          rotateX(0deg)
          scale(1)
        `;
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [imageError]);

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // Enhanced scene change handler with proper feedback
  const handleSceneChange = (sceneId: string) => {
    console.log(`Changing to scene: ${sceneId}`);
    // Show feedback before changing scene
    const sceneElement = document.getElementById('scene-description');
    if (sceneElement) {
      sceneElement.classList.add('opacity-50');
      setTimeout(() => sceneElement.classList.remove('opacity-50'), 500);
    }
    
    changeScene(sceneId);
    // Force reload scene description after short delay
    setTimeout(() => generateSceneNarrative(), 300);
  };

  // Enhanced clue discovery handler with visual feedback
  const handleClueDiscovery = (clueId: string) => {
    console.log(`Discovering clue: ${clueId}`);
    // Add visual feedback
    const clueContainer = document.getElementById('clues-container');
    if (clueContainer) {
      clueContainer.classList.add('animate-pulse');
      setTimeout(() => clueContainer.classList.remove('animate-pulse'), 1000);
    }
    
    discoverClue(clueId);
  };

  // Calculate how many clues have been discovered in the scene
  const discoveredClueCount = visibleClues.filter(clue => clue.discovered).length;
  const totalClueCount = visibleClues.length;
  const clueProgress = Math.floor((discoveredClueCount / totalClueCount) * 100);

  // Determine scene transition effect
  const sceneTransition = gameplayState.narrativeFocus === 'scene' && isGeneratingNarrative;

  return (
    <div className={`flex flex-col gap-6 w-full max-w-4xl mx-auto ${sceneTransition ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
      {/* Scene Background */}
      <div className="relative">
        <div 
          ref={sceneBgRef}
          className="w-full h-80 rounded-lg bg-cover bg-center relative transition-transform duration-200 overflow-hidden"
          style={{ 
            backgroundColor: imageError ? '#1a1a1a' : undefined,
            backgroundImage: !imageError ? `url(${currentScene.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            transformStyle: 'preserve-3d'
          }}
        >
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl opacity-30">🔍</div>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="text-center text-white p-4 bg-black/40 rounded-lg backdrop-blur-md">
              <h2 className="text-3xl font-bold mb-2 font-serif">{currentScene.name}</h2>
              <p className="text-sm opacity-80">{currentScene.description}</p>
            </div>
          </div>
          
          {/* Scene navigation buttons */}
          <div className="absolute bottom-4 right-4 flex space-x-2" id="scene-navigation">
            {allScenes
              .filter(scene => scene.id !== currentScene.id)
              .map(scene => (
                <HoverCard key={scene.id}>
                  <HoverCardTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-black/50 border-white/20 hover:bg-black/70 text-white"
                      onClick={() => handleSceneChange(scene.id)}
                    >
                      Go to {scene.name}
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">{scene.name}</h4>
                      <p className="text-xs">{scene.description}</p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
          </div>
          
          {/* Hidden image to check if it loads */}
          <img 
            src={currentScene.backgroundImage} 
            alt="" 
            className="hidden" 
            onError={handleImageError}
          />
          
          {/* Clue progress indicator */}
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm flex items-center text-white text-xs">
              <span className="mr-2">Clues:</span>
              <span className="font-bold">{discoveredClueCount}/{totalClueCount}</span>
              <div className="ml-2 w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{width: `${clueProgress}%`}}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Detective hints */}
        <Button
          variant="link"
          size="sm" 
          className="text-xs absolute -bottom-6 right-0 text-muted-foreground"
          onClick={() => setShowHints(!showHints)}
        >
          {showHints ? "Hide Detective's Insights" : "Show Detective's Insights"}
        </Button>
      </div>

      {/* Scene Description */}
      <Card className="p-6 detective-paper relative" id="scene-description">
        {showHints && gameplayState.hints.length > 0 && (
          <div className="absolute -top-4 right-6 bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-lg shadow-md border border-yellow-200 dark:border-yellow-800 max-w-xs z-10">
            <h4 className="text-sm font-bold mb-1">Detective&apos;s Insights:</h4>
            <ul className="text-xs space-y-1 list-disc list-inside">
              {gameplayState.hints.map((hint, index) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="fingerprint-overlay"></div>
        <NarrativeDisplay 
          content={narrativeContent} 
          isLoading={isGeneratingNarrative} 
          title="Scene Investigation"
          highlightTerms={["clue", "suspicious", "mysterious", "hidden", "important", "notice"]}
        />
        
        {/* Regenerate description button */}
        {!isGeneratingNarrative && (
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => generateSceneNarrative()}
              className="text-xs"
            >
              Investigate Again
            </Button>
          </div>
        )}
      </Card>

      {/* Available Clues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="clues-container">
        {visibleClues.map((clue) => (
          <div key={clue.id} id={`clue-${clue.id}`}>
            <ClueItem 
              clue={clue} 
              onDiscover={() => handleClueDiscovery(clue.id)} 
            />
          </div>
        ))}
      </div>
      
      {/* Game activity log - shows recent actions */}
      {gameplayState.playerActions.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <details className="text-sm">
            <summary className="font-medium cursor-pointer">Detective&apos;s Activity Log</summary>
            <ul className="mt-2 space-y-1 text-muted-foreground text-xs">
              {gameplayState.playerActions.slice(0, 5).map((action, idx) => (
                <li key={idx} className="font-mono">{action}</li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {isGeneratingNarrative && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-50">
          <div className="w-10 h-10 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
          <p className="mt-2 text-white">Loading new scene...</p>
        </div>
      )}
    </div>
  );
} 