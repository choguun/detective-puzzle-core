"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGame } from "./game-context";
import { generateNarrative } from "./llm-service";
import { processSceneAction, ActionResponse } from "./action-processor";
import { generateImage as genImage } from "./image-service";

// Global request tracking to prevent duplicate requests across component instances
const pendingRequests = new Map<string, Promise<unknown>>();
const completedRequests = new Set<string>();

interface GameplayState {
  playerActions: string[];
  imagePrompts: string[];
}

export default function useGameplay() {
  const game = useGame();
  const { 
    currentSceneId, 
    scenes, 
    clues, 
    isGameStarted, 
    gameTime,
    isTimerRunning,
    discoveredClueIds,
    setCurrentSceneId,
    startGame: contextStartGame,
    discoverClue,
    startTimer,
    isSceneCompleted
  } = game;

  // Local state
  const [currentNarrative, setCurrentNarrative] = useState<string>("");
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState<boolean>(false);
  const [narrativeCache, setNarrativeCache] = useState<Record<string, string>>({});
  const [gameplayState, setGameplayState] = useState<GameplayState>({
    playerActions: [],
    imagePrompts: [],
  });
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [isGeneratingSceneImage, setIsGeneratingSceneImage] = useState<boolean>(false);
  
  // Refs to track component state
  const generationInProgress = useRef(false);
  const lastSceneId = useRef<string | null>(null);

  // Get current scene from the game context
  const currentScene = currentSceneId ? scenes.find(s => s.id === currentSceneId) : null;
  
  // Get all available scenes for navigation
  const availableScenes = scenes;
  
  // Get discovered clues
  const discoveredClues = clues.filter(clue => clue.discovered);

  // Start the game
  const startGame = useCallback(() => {
    contextStartGame();
    startTimer();
  }, [contextStartGame, startTimer]);

  // Generate narrative for the current scene
  const regenerateNarrative = useCallback(async (forceRegenerate = false) => {
    if (!currentScene) return;
    
    // Skip if already generating
    if (generationInProgress.current && !forceRegenerate) {
      console.log("Generation already in progress, skipping");
      return;
    }
    
    // Create a unique request ID for this specific scene state
    const discoveredCluesCount = discoveredClueIds.filter(id => 
      currentScene.clueIds.includes(id)).length;
      
    const requestId = `scene_${currentScene.id}_${discoveredCluesCount}`;
    
    // Skip if this exact request was already completed (unless forcing)
    if (!forceRegenerate && completedRequests.has(requestId)) {
      console.log(`Scene ${currentScene.id} already generated, using cached data`);
      
      // If we have cached content, use it
      if (narrativeCache[requestId]) {
        setCurrentNarrative(narrativeCache[requestId]);
      }
      return;
    }
    
    // If this same request is already in progress from another component, wait for it
    if (!forceRegenerate && pendingRequests.has(requestId)) {
      console.log(`Request for ${requestId} already in progress, waiting for results`);
      try {
        setIsGeneratingNarrative(true);
        await pendingRequests.get(requestId);
        
        // The result should now be in the cache
        if (narrativeCache[requestId]) {
          setCurrentNarrative(narrativeCache[requestId]);
        }
      } catch (error) {
        console.error("Error waiting for pending request:", error);
      } finally {
        setIsGeneratingNarrative(false);
      }
      return;
    }
    
    // Set the lock
    generationInProgress.current = true;
    
    try {
      setIsGeneratingNarrative(true);
      
      // Create a promise for this request that other components can wait for
      const generationPromise = (async () => {
        // Generate narrative using LLM
        const result = await generateNarrative({
          type: "scene_description",
          scene: currentScene,
          discoveredClues: discoveredClues.filter(clue => clue.sceneId === currentScene.id),
          customContext: `This is the ${currentScene.name}. The detective is investigating here.`
        });
        
        // Store in cache and update state
        const newCache = { ...narrativeCache, [requestId]: result.content };
        setNarrativeCache(newCache);
        setCurrentNarrative(result.content);
        
        // Mark as completed
        completedRequests.add(requestId);
        
        return result;
      })();
      
      // Register this promise globally
      pendingRequests.set(requestId, generationPromise);
      
      // Wait for generation to complete
      await generationPromise;
      
      // Remove from pending when done
      pendingRequests.delete(requestId);
      
    } catch (error) {
      console.error("Failed to generate scene narrative:", error);
      // Use the default scene description as fallback
      setCurrentNarrative(currentScene.description);
      
      // Remove from pending if error
      pendingRequests.delete(requestId);
    } finally {
      setIsGeneratingNarrative(false);
      generationInProgress.current = false;
    }
  }, [currentScene, discoveredClues, discoveredClueIds, narrativeCache]);

  // Handle scene change
  useEffect(() => {
    // Only trigger for scene changes
    if (currentScene && currentScene.id !== lastSceneId.current) {
      console.log(`Scene changed to ${currentScene.id} from ${lastSceneId.current}`);
      lastSceneId.current = currentScene.id;
      
      // Call narrative generation immediately, but don't force
      regenerateNarrative(false);
    }
  }, [currentSceneId, currentScene, regenerateNarrative]);
  
  // Don't use the old effect that could trigger multiple times
  // This is now handled by the more specific scene change effect above

  // Generate image for the scene
  const generateImage = useCallback(async (customPrompt?: string) => {
    if (!currentScene) return null;

    try {
      setIsGeneratingSceneImage(true);
      
      // Track this prompt
      setGameplayState(prev => ({
        ...prev,
        imagePrompts: [...prev.imagePrompts, customPrompt || currentScene.description]
      }));
      
      // Use the image service to generate the image
      const result = await genImage({
        prompt: customPrompt || `A detailed view of ${currentScene.name}: ${currentScene.description}`,
        size: "1024x1024"
      });
      
      if (result.url) {
        setSceneImageUrl(result.url);
        return result;
      }
      
      return null;
    } catch (error) {
      console.error("Failed to generate scene image:", error);
      return null;
    } finally {
      setIsGeneratingSceneImage(false);
    }
  }, [currentScene]);

  // Handle player actions
  const handleAction = useCallback(async (action: string): Promise<ActionResponse> => {
    if (!currentScene) throw new Error("No current scene");
    
    // Track this action
    setGameplayState(prev => ({
      ...prev,
      playerActions: [...prev.playerActions, action]
    }));
    
    // Process the player's action
    const response = await processSceneAction({
      action,
      scene: currentScene,
      discoveredClues: discoveredClues.filter(clue => clue.sceneId === currentScene.id)
    });
    
    // Process any clues that were revealed
    if (response.revealedClues && response.revealedClues.length > 0) {
      for (const clueId of response.revealedClues) {
        if (currentScene.clueIds.includes(clueId) && !discoveredClueIds.includes(clueId)) {
          await discoverClue(clueId);
        }
      }
    }
    
    return response;
  }, [currentScene, discoveredClues, discoveredClueIds, discoverClue]);

  // Return the gameplay state and functions
  return {
    // Scene state
    currentScene,
    availableScenes,
    discoveredClues,
    discoveredClueIds,
    
    // Game state
    gameplayState,
    isGameStarted,
    totalSeconds: gameTime,
    isTimerRunning,
    
    // Narrative state
    currentNarrative,
    isGeneratingNarrative,
    
    // Image state
    sceneImageUrl,
    isGeneratingSceneImage,
    
    // Scene completion
    isSceneCompleted,
    
    // Actions
    discoverClue,
    handleAction,
    regenerateNarrative,
    generateImage,
    startGame,
    setCurrentSceneId
  };
} 