"use client";

import { useState, useEffect, useCallback } from "react";
import { useGame } from "./game-context";
import { generateNarrative } from "./llm-service";
import { processSceneAction, ActionResponse } from "./action-processor";
import { generateImage as genImage } from "./image-service";

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
  const [gameplayState, setGameplayState] = useState<GameplayState>({
    playerActions: [],
    imagePrompts: [],
  });
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [isGeneratingSceneImage, setIsGeneratingSceneImage] = useState<boolean>(false);

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
  const regenerateNarrative = useCallback(async () => {
    if (!currentScene) return;

    try {
      setIsGeneratingNarrative(true);
      
      // Generate narrative using LLM
      const result = await generateNarrative({
        type: "scene_description",
        scene: currentScene,
        discoveredClues: discoveredClues.filter(clue => clue.sceneId === currentScene.id),
        customContext: `This is the ${currentScene.name}. The detective is investigating here.`
      });
      
      setCurrentNarrative(result.content);
      
    } catch (error) {
      console.error("Failed to generate scene narrative:", error);
      // Use the default scene description as fallback
      setCurrentNarrative(currentScene.description);
    } finally {
      setIsGeneratingNarrative(false);
    }
  }, [currentScene, discoveredClues]);

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

  // Generate narrative when scene changes
  useEffect(() => {
    if (currentScene && !currentNarrative) {
      regenerateNarrative();
    }
  }, [currentScene, currentNarrative, regenerateNarrative]);

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