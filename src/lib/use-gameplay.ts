"use client";

import { useState, useEffect, useCallback } from "react";
import { useGame } from "./game-context";
import { generateNarrative } from "./llm-service";

export type GameplayState = {
  narrativeFocus: 'scene' | 'clue' | 'analysis' | 'conclusion' | null;
  activeClueId: string | null;
  recentDiscoveries: string[];
  difficultyLevel: 'easy' | 'medium' | 'hard';
  hints: string[];
  playerActions: string[];
  gameTime: number; // seconds
  connectionLines: {from: string, to: string, label: string}[];
}

export default function useGameplay() {
  const { gameState, discoverClue, examineClue, updatePlayerNotes, changeScene, completeGame } = useGame();
  const { currentScene, allClues, allScenes, playerNotes, gameProgress, gameStarted, gameCompleted } = gameState;
  
  const [gameplayState, setGameplayState] = useState<GameplayState>({
    narrativeFocus: null,
    activeClueId: null,
    recentDiscoveries: [],
    difficultyLevel: 'medium',
    hints: [],
    playerActions: [],
    gameTime: 0,
    connectionLines: [],
  });
  
  const [narrativeContent, setNarrativeContent] = useState<string>("");
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  
  // Timer for game duration tracking
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (gameStarted && !gameCompleted) {
      timer = setInterval(() => {
        setGameplayState(prev => ({
          ...prev,
          gameTime: prev.gameTime + 1
        }));
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameStarted, gameCompleted]);
  
  // Generate hints based on current progress
  useEffect(() => {
    if (gameStarted && !gameCompleted) {
      const discoveredClues = allClues.filter(clue => clue.discovered);
      const examinedClues = allClues.filter(clue => clue.examined);
      const undiscoveredClues = allClues.filter(clue => !clue.discovered && currentScene.availableClues.includes(clue.id));
      
      const newHints: string[] = [];
      
      // Generate hints based on game state
      if (discoveredClues.length === 0) {
        newHints.push("Look around the scene carefully. There are clues hidden in plain sight.");
      }
      
      if (discoveredClues.length > 0 && examinedClues.length === 0) {
        newHints.push("Don't just discover clues - examine them closely to reveal hidden details.");
      }
      
      if (discoveredClues.length >= 2 && examinedClues.length >= 2 && playerNotes.length < 50) {
        newHints.push("Take notes on your findings to help connect the evidence.");
      }
      
      if (undiscoveredClues.length === 1) {
        newHints.push("There's still one more clue to discover in this scene.");
      }
      
      // Add hint about changing scenes if current scene is mostly explored
      const currentSceneClues = allClues.filter(clue => currentScene.availableClues.includes(clue.id));
      const discoveredInScene = currentSceneClues.filter(clue => clue.discovered);
      
      if (discoveredInScene.length === currentSceneClues.length && allScenes.length > 1) {
        const otherScenes = allScenes.filter(scene => scene.id !== currentScene.id);
        if (otherScenes.length > 0) {
          newHints.push(`Consider exploring ${otherScenes[0].name} for more clues.`);
        }
      }
      
      // Update hints if they've changed
      if (newHints.length > 0 && JSON.stringify(newHints) !== JSON.stringify(gameplayState.hints)) {
        setGameplayState(prev => ({
          ...prev,
          hints: newHints
        }));
      }
    }
  }, [allClues, currentScene, allScenes, gameStarted, gameCompleted, playerNotes, gameplayState.hints]);
  
  // Generate initial scene narrative when scene changes
  useEffect(() => {
    if (gameStarted && currentScene) {
      generateSceneNarrative();
    }
  }, [currentScene, gameStarted]);
  
  // Track narrative focus
  useEffect(() => {
    // Reset narrative focus when scene changes
    setGameplayState(prev => ({
      ...prev,
      narrativeFocus: 'scene',
      activeClueId: null
    }));
  }, [currentScene.id]);
  
  // Generate scene narrative
  const generateSceneNarrative = useCallback(async () => {
    setIsGeneratingNarrative(true);
    setGameplayState(prev => ({
      ...prev,
      narrativeFocus: 'scene'
    }));
    
    try {
      const response = await generateNarrative({
        type: "scene_description",
        scene: currentScene,
      });
      
      setNarrativeContent(response.content);
      
      // Dynamically adapt difficulty based on progress
      if (gameProgress > 50) {
        setGameplayState(prev => ({
          ...prev,
          difficultyLevel: 'hard'
        }));
      } else if (gameProgress > 25) {
        setGameplayState(prev => ({
          ...prev,
          difficultyLevel: 'medium'
        }));
      }
      
      // Record player action
      logPlayerAction(`Investigated ${currentScene.name}`);
      
    } catch (error) {
      console.error("Failed to generate scene narrative:", error);
      setNarrativeContent(`You enter ${currentScene.description}`);
    } finally {
      setIsGeneratingNarrative(false);
    }
  }, [currentScene]);
  
  // Handle discovering a clue with enhanced narrative
  const handleDiscoverClue = useCallback(async (clueId: string) => {
    const clue = allClues.find(c => c.id === clueId);
    if (!clue) return;
    
    // Core game mechanic
    discoverClue(clueId);
    
    // Add to recent discoveries
    setGameplayState(prev => ({
      ...prev,
      recentDiscoveries: [clueId, ...prev.recentDiscoveries].slice(0, 5),
      narrativeFocus: 'clue',
      activeClueId: clueId
    }));
    
    // Log player action
    logPlayerAction(`Discovered ${clue.name}`);
  }, [allClues, discoverClue]);
  
  // Handle examining a clue with enhanced narrative
  const handleExamineClue = useCallback(async (clueId: string) => {
    const clue = allClues.find(c => c.id === clueId);
    if (!clue) return;
    
    setIsGeneratingNarrative(true);
    setGameplayState(prev => ({
      ...prev,
      narrativeFocus: 'clue',
      activeClueId: clueId
    }));
    
    try {
      // Get all discovered clues except the current one
      const discoveredClues = allClues.filter(c => c.discovered && c.id !== clueId);
      
      const response = await generateNarrative({
        type: "clue_examination",
        clue,
        discoveredClues,
      });
      
      setNarrativeContent(response.content);
      
      // Core game mechanic
      examineClue(clueId);
      
      // Log player action
      logPlayerAction(`Examined ${clue.name} in detail`);
      
    } catch (error) {
      console.error("Failed to examine clue:", error);
      setNarrativeContent(`You examine the ${clue.name} closely but find nothing of note.`);
    } finally {
      setIsGeneratingNarrative(false);
    }
  }, [allClues, examineClue]);
  
  // Handle scene change
  const handleChangeScene = useCallback((sceneId: string) => {
    const targetScene = allScenes.find(scene => scene.id === sceneId);
    if (!targetScene) return;
    
    // Log player action
    logPlayerAction(`Moved to ${targetScene.name}`);
    
    // Core game mechanic
    changeScene(sceneId);
  }, [allScenes, changeScene]);
  
  // Generate story progression
  const handleGenerateProgression = useCallback(async () => {
    const discoveredClues = allClues.filter(clue => clue.discovered);
    if (discoveredClues.length === 0) return;
    
    setIsGeneratingNarrative(true);
    setGameplayState(prev => ({
      ...prev,
      narrativeFocus: 'analysis'
    }));
    
    try {
      const response = await generateNarrative({
        type: "story_progression",
        discoveredClues,
        playerContext: playerNotes,
      });
      
      setNarrativeContent(response.content);
      
      // Log player action
      logPlayerAction("Analyzed evidence");
      
    } catch (error) {
      console.error("Failed to generate story progression:", error);
      setNarrativeContent("You review the evidence but can't make any clear connections yet.");
    } finally {
      setIsGeneratingNarrative(false);
    }
  }, [allClues, playerNotes]);
  
  // Generate conclusion and solve case
  const handleSolveCase = useCallback(async () => {
    const examinedClues = allClues.filter(clue => clue.examined);
    if (examinedClues.length < 3) return; // Require at least 3 examined clues
    
    setIsGeneratingNarrative(true);
    setGameplayState(prev => ({
      ...prev,
      narrativeFocus: 'conclusion'
    }));
    
    try {
      const response = await generateNarrative({
        type: "conclusion",
        discoveredClues: examinedClues,
        playerContext: playerNotes,
      });
      
      setNarrativeContent(response.content);
      
      // Log player action
      logPlayerAction("Solved the case");
      
      // Core game mechanic
      completeGame();
      
    } catch (error) {
      console.error("Failed to generate conclusion:", error);
      setNarrativeContent("Your theory has some inconsistencies. Review the evidence again.");
    } finally {
      setIsGeneratingNarrative(false);
    }
  }, [allClues, playerNotes, completeGame]);
  
  // Update player notes with enhanced autosave
  const handleUpdateNotes = useCallback((notes: string) => {
    updatePlayerNotes(notes);
    
    // Only log major note updates
    if (Math.abs(notes.length - playerNotes.length) > 20) {
      logPlayerAction("Updated case notes");
    }
  }, [playerNotes, updatePlayerNotes]);
  
  // Helper function to log player actions with timestamp
  const logPlayerAction = useCallback((action: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const actionWithTime = `${timestamp} - ${action}`;
    
    setGameplayState(prev => ({
      ...prev,
      playerActions: [actionWithTime, ...prev.playerActions].slice(0, 20) // Keep last 20 actions
    }));
  }, []);

  // Generate random connections between clues for the visual map
  useEffect(() => {
    if (gameStarted && !gameCompleted) {
      const examinedClues = allClues.filter(clue => clue.examined);
      
      if (examinedClues.length >= 2) {
        const possibleConnections = [
          "might be related to",
          "contradicts",
          "supports",
          "was found near",
          "shares similarities with",
          "could be connected to",
          "appears to reference",
        ];
        
        const newConnections: {from: string, to: string, label: string}[] = [];
        
        // Create some realistic connections between clues
        for (let i = 0; i < examinedClues.length; i++) {
          for (let j = i + 1; j < examinedClues.length; j++) {
            // Add connections with 60% probability
            if (Math.random() < 0.6) {
              const randomConnection = possibleConnections[Math.floor(Math.random() * possibleConnections.length)];
              newConnections.push({
                from: examinedClues[i].id,
                to: examinedClues[j].id,
                label: randomConnection
              });
            }
          }
        }
        
        // Only update if connections have changed
        if (JSON.stringify(newConnections) !== JSON.stringify(gameplayState.connectionLines)) {
          setGameplayState(prev => ({
            ...prev,
            connectionLines: newConnections
          }));
        }
      }
    }
  }, [allClues, gameStarted, gameCompleted, gameplayState.connectionLines]);

  return {
    // State
    gameplayState,
    narrativeContent,
    isGeneratingNarrative,
    
    // Actions
    handleDiscoverClue,
    handleExamineClue,
    handleChangeScene,
    handleGenerateProgression,
    handleSolveCase,
    handleUpdateNotes,
    generateSceneNarrative,
    
    // Game state from context
    currentScene,
    allClues,
    allScenes,
    playerNotes,
    gameProgress,
    gameStarted,
    gameCompleted
  };
} 