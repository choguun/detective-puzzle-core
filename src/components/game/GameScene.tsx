"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import useGameplay from "@/lib/use-gameplay";
import { processSceneAction, ActionResponse } from "@/lib/action-processor";
import ClueItem from "./ClueItem";
import Spinner from "../ui/spinner";
import GameTimer from "./GameTimer";
import SceneSelector from "./SceneSelector";

export default function GameScene() {
  // Game context
  const {
    currentScene,
    availableScenes,
    discoveredClues,
    discoveredClueIds,
    discoverClue,
    generateImage,
    sceneImageUrl,
    currentNarrative,
    regenerateNarrative,
    totalSeconds,
    isTimerRunning,
    isGameStarted,
    startGame
  } = useGameplay();

  // Router
  const router = useRouter();

  // Refs
  const sceneRef = useRef<HTMLDivElement>(null);
  const actionInputRef = useRef<HTMLTextAreaElement>(null);

  // State for player action
  const [playerAction, setPlayerAction] = useState<string>("");
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // State for mouse position
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Image generation state
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [customImagePrompt, setCustomImagePrompt] = useState<string>("");
  const [showImagePromptDialog, setShowImagePromptDialog] = useState<boolean>(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const [showRevisedPrompt, setShowRevisedPrompt] = useState<boolean>(false);

  // Action state
  const [actionResponse, setActionResponse] = useState<string | null>(null);
  const [actionHistory, setActionHistory] = useState<ActionResponse[]>([]);

  // Scene completion tracking
  const [completedScenes, setCompletedScenes] = useState<Record<string, boolean>>({});
  const [showSceneCompletionDialog, setShowSceneCompletionDialog] = useState<boolean>(false);
  
  // Feedback state
  const [actionFeedback, setActionFeedback] = useState<{message: string, type: string} | null>(null);

  // Define showActionFeedback first, before any useCallback that depends on it
  const showActionFeedback = useCallback((message: string, type: "success" | "error" | "info") => {
    setActionFeedback({ message, type });
    
    // Auto-clear after delay
    setTimeout(() => {
      setActionFeedback(null);
    }, 3000);
  }, []);

  // Check if all clues in the current scene have been discovered
  const checkSceneCompletion = useCallback(() => {
    if (!currentScene) return;
    
    // Don't check already completed scenes
    if (completedScenes[currentScene.id]) return;
    
    // Get all clues in this scene
    const sceneClues = currentScene.clueIds || [];
    
    // Check if all clues are discovered
    const allDiscovered = sceneClues.every(clueId => 
      discoveredClueIds.includes(clueId)
    );
    
    if (allDiscovered && sceneClues.length > 0) {
      // Mark scene as completed
      setCompletedScenes(prev => ({
        ...prev,
        [currentScene.id]: true
      }));
      
      // Show completion dialog
      setShowSceneCompletionDialog(true);
      
      // Show success message
      showActionFeedback(
        `You've discovered all clues in the ${currentScene.name}!`, 
        "success"
      );
    }
  }, [currentScene, completedScenes, discoveredClueIds, showActionFeedback]);

  // Check completion when discovered clues change
  useEffect(() => {
    checkSceneCompletion();
  }, [discoveredClueIds, currentScene, checkSceneCompletion]);

  // Format timer display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sceneRef.current) return;
    
    const rect = sceneRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setMousePosition(null);
  };

  // Handle image loading error
  const handleImageError = () => {
    // If the image fails to load, try loading a default image
    setBackgroundImageUrl("/images/detective-background.jpg");
  };

  // Handle scene change
  const handleSceneChange = (sceneId: string) => {
    if (!sceneId || !availableScenes) return;
    
    // If we have navigation confirmation for important scenes, add it here
    
    console.log(`Changing scene to: ${sceneId}`);
    
    // Reset the scene-specific state
    setActionResponse(null);
    setMousePosition(null);
    setBackgroundImageUrl(null);
    
    // Change the scene in the game context
    router.push(`/game/${sceneId}`);
    
    // Force reload scene description
    regenerateNarrative();
  };

  // Handle clue discovery through player actions
  const handleClueDiscovery = (clueId: string) => {
    // Prevent discovering already found clues
    if (discoveredClueIds.includes(clueId)) return;
    
    console.log(`Discovering clue: ${clueId}`);
    
    // Add to discovered clues
    discoverClue(clueId);
    
    // Visual feedback
    showActionFeedback("You've discovered a new clue!", "success");
    
    // Play clue discovery animation/sound here if needed
    const clueElement = document.getElementById(`clue-${clueId}`);
    if (clueElement) {
      clueElement.classList.add("discovered-animation");
      setTimeout(() => {
        clueElement.classList.remove("discovered-animation");
      }, 1500);
    }
    
    // Check if all clues are discovered
    checkSceneCompletion();
  };

  // Handle player action in the scene  
  const handleSceneAction = async (action: string) => {
    if (!action.trim() || !currentScene) return;
    
    try {
      setIsProcessingAction(true);
      setActionResponse(null);
      
      // Process action
      const response = await processSceneAction({
        action,
        scene: currentScene,
        discoveredClues: discoveredClues,
        playerContext: actionHistory.map(a => a.content).join("\n")
      });
      
      // Update UI with the response
      setActionResponse(response.content);
      
      // Add to action history
      setActionHistory(prev => [...prev, response]);
      
      // Check if any clues were found
      if (response.revealedClues && response.revealedClues.length > 0) {
        response.revealedClues.forEach(clueId => {
          if (currentScene.clueIds.includes(clueId)) {
            handleClueDiscovery(clueId);
          }
        });
      }
      
      // Show success or hint feedback
      if (response.success) {
        showActionFeedback("Your action was successful!", "success");
      } else if (response.hintGiven) {
        showActionFeedback("You've received a hint!", "info");
      }
      
      // Clear the action input
      setPlayerAction("");
      
    } catch (error) {
      console.error("Error processing action:", error);
      showActionFeedback("There was a problem processing your action. Please try again.", "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Move to next scene after completing current one
  const handleMoveToNextScene = () => {
    // Close the dialog
    setShowSceneCompletionDialog(false);
    
    // If we have a predefined order, we can automatically move to the next scene
    if (availableScenes && currentScene) {
      const currentIndex = availableScenes.findIndex(s => s.id === currentScene.id);
      if (currentIndex >= 0 && currentIndex < availableScenes.length - 1) {
        const nextScene = availableScenes[currentIndex + 1];
        handleSceneChange(nextScene.id);
      }
    }
  };

  // UI for displaying hints
  const [showHints, setShowHints] = useState<boolean>(false);
  
  // Toggle hints display
  const toggleHints = () => {
    setShowHints(prev => !prev);
  };

  // Generate narrative/scene description
  const handleGenerateSceneImage = async (customPrompt?: string) => {
    try {
      setIsGeneratingImage(true);
      
      // Generate image using the game context function
      const result = await generateImage(customPrompt);
      
      // Store the revised prompt if provided
      if (result && result.revisedPrompt) {
        setRevisedPrompt(result.revisedPrompt);
      }
      
      setShowImagePromptDialog(false);
      setCustomImagePrompt("");
      
    } catch (error) {
      console.error("Error generating image:", error);
      showActionFeedback("There was a problem generating the image. Please try again.", "error");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handle opening the prompt dialog
  const handleOpenPromptDialog = () => {
    setShowImagePromptDialog(true);
  };

  // Toggle showing revised prompt
  const toggleRevisedPrompt = () => {
    setShowRevisedPrompt(prev => !prev);
  };

  // Regenerate the narrative description
  const handleRegenerateNarrative = () => {
    regenerateNarrative();
  };

  // Start game if not started
  useEffect(() => {
    if (!isGameStarted) {
      startGame();
    }
  }, [isGameStarted, startGame]);

  // Set background image when scene changes
  useEffect(() => {
    if (!currentScene) return;
    
    if (currentScene.backgroundImage) {
      setBackgroundImageUrl(currentScene.backgroundImage);
    } else if (currentScene.imageUrl) {
      setBackgroundImageUrl(currentScene.imageUrl);
    } else {
      setBackgroundImageUrl("/images/detective-background.jpg");
    }
  }, [currentScene]);

  // Focus action input on mount
  useEffect(() => {
    if (actionInputRef.current) {
      actionInputRef.current.focus();
    }
  }, []);

  // If no current scene, show loading or redirect
  if (!currentScene) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4">Loading scene...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[calc(100vh-64px)] bg-gray-900 text-white">
      {/* Left Column - Scene Image & Clues */}
      <div className="md:col-span-2 relative overflow-hidden rounded-lg">
        <div 
          ref={sceneRef}
          className="relative w-full h-[60vh] md:h-[70vh] bg-black/50 overflow-hidden rounded-lg"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Scene Background */}
          {backgroundImageUrl && (
            <Image
              src={backgroundImageUrl}
              alt={currentScene.name}
              fill
              className="object-cover opacity-75"
              priority
              onError={handleImageError}
            />
          )}
          
          {/* Scene Generated Image Overlay */}
          {sceneImageUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={sceneImageUrl}
                alt={`Generated scene: ${currentScene.name}`}
                width={800}
                height={600}
                className="max-h-full max-w-full object-contain opacity-90 z-10"
              />
            </div>
          )}
          
          {/* Clues Container (now hidden from direct clicking, only via actions) */}
          <div 
            id="clues-container"
            className="absolute inset-0 z-20 pointer-events-none" 
          >
            {/* Discovered clues will be visualized here as they're found through actions */}
            {discoveredClues.filter(clue => clue.sceneId === currentScene.id).map(clue => (
              <div
                key={clue.id}
                id={`clue-${clue.id}`}
                className="clue-item opacity-75 hover:opacity-100 transition-opacity pointer-events-none"
              >
                <ClueItem 
                  clue={clue} 
                  onDiscover={() => {}} 
                  key={clue.id}
                />
              </div>
            ))}
          </div>
          
          {/* Mouse position indicator (debug only) */}
          {mousePosition && (
            <div 
              className="absolute w-2 h-2 bg-red-500 rounded-full z-30 hidden"
              style={{ 
                left: `${mousePosition.x}%`, 
                top: `${mousePosition.y}%` 
              }}
            />
          )}
          
          {/* Action Feedback */}
          {actionFeedback && (
            <div 
              className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg z-50 transition-opacity duration-300 ${
                actionFeedback.type === "success" ? "bg-green-600" : 
                actionFeedback.type === "error" ? "bg-red-600" : 
                "bg-blue-600"
              }`}
            >
              {actionFeedback.message}
            </div>
          )}
          
          {/* Loading overlay */}
          {isGeneratingImage && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="mt-4">Generating scene image...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Action Input */}
        <div className="mt-4 px-4">
          <div className="relative">
            <Textarea
              ref={actionInputRef}
              value={playerAction}
              onChange={(e) => setPlayerAction(e.target.value)}
              placeholder="What would you like to do? (e.g., 'Examine the desk', 'Look at the painting')"
              className="w-full p-3 bg-gray-800 text-white border-gray-700 rounded-lg"
              rows={2}
              disabled={isProcessingAction}
              id="action-input"
            />
            <Button
              onClick={() => handleSceneAction(playerAction)}
              disabled={!playerAction.trim() || isProcessingAction}
              className="absolute right-2 bottom-2 bg-blue-600 hover:bg-blue-500"
            >
              {isProcessingAction ? <Spinner size="sm" /> : "Take Action"}
            </Button>
          </div>
        </div>
        
        {/* Action Response */}
        {actionResponse && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2">Results:</h3>
            <div className="prose prose-invert max-w-none">
              {actionResponse.split('\n').map((paragraph, i) => (
                <p key={i} className={paragraph.includes("*You found") ? "text-green-400 font-semibold" : ""}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Right Column - Scene Info & Navigation */}
      <div className="p-4 bg-gray-800 rounded-lg flex flex-col h-[70vh] md:h-[80vh] overflow-y-auto">
        {/* Scene Name & Timer */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{currentScene.name}</h2>
          <GameTimer 
            seconds={totalSeconds} 
            isRunning={isTimerRunning} 
            format={formatTime}
          />
        </div>
        
        {/* Scene Description */}
        <div id="scene-description" className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Scene Description</h3>
          <div className="prose prose-invert max-w-none">
            {currentNarrative ? (
              <div>
                {currentNarrative.split('\n').map((paragraph, i) => (
                  paragraph.trim() ? <p key={i}>{paragraph}</p> : null
                ))}
              </div>
            ) : (
              <p>{currentScene.description}</p>
            )}
          </div>
          <div className="flex space-x-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRegenerateNarrative}
              className="text-xs"
            >
              Refresh Description
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleOpenPromptDialog}
              className="text-xs"
            >
              Generate Scene Image
            </Button>
            {revisedPrompt && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleRevisedPrompt}
                className="text-xs"
              >
                {showRevisedPrompt ? "Hide Prompt" : "Show Prompt"}
              </Button>
            )}
          </div>
          {showRevisedPrompt && revisedPrompt && (
            <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
              <p>Revised prompt: {revisedPrompt}</p>
            </div>
          )}
        </div>
        
        {/* Discovered Clues */}
        <div id="discovered-clues" className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Discovered Clues</h3>
          {discoveredClues.filter(clue => clue.sceneId === currentScene.id).length > 0 ? (
            <div className="space-y-2">
              {discoveredClues
                .filter(clue => clue.sceneId === currentScene.id)
                .map(clue => (
                  <div key={clue.id} className="p-2 bg-gray-700 rounded">
                    <h4 className="font-medium">{clue.name}</h4>
                    <p className="text-sm text-gray-300">{clue.description}</p>
                  </div>
                ))
              }
              <div className="text-sm text-gray-400 mt-1">
                Found {discoveredClues.filter(clue => clue.sceneId === currentScene.id).length} of {currentScene.clueIds?.length || 0} clues
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No clues discovered in this scene yet. Try taking actions to find clues!</p>
          )}
        </div>
        
        {/* Scene Navigation */}
        <div className="mt-auto" id="scene-navigation">
          <h3 className="text-lg font-semibold mb-2">Change Location</h3>
          <SceneSelector 
            scenes={availableScenes} 
            currentSceneId={currentScene.id}
            onSceneChange={handleSceneChange}
            completedScenes={completedScenes}
          />
        </div>
        
        {/* Hints Button */}
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={toggleHints}
            className="w-full"
          >
            {showHints ? "Hide Hints" : "Show Hints"}
          </Button>
          
          {showHints && (
            <div className="mt-2 p-3 bg-gray-700 rounded">
              <h4 className="font-medium mb-1">Investigation Tips:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Try examining specific objects mentioned in the scene description</li>
                <li>Use verbs like &quot;examine&quot;, &quot;search&quot;, &quot;open&quot;, or &quot;look at&quot;</li>
                <li>If stuck, try thinking about what a real detective would do</li>
                <li>Sometimes you need to find one clue before others become available</li>
                <li>All scenes have 5 clues to discover through actions</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Scene Completion Dialog */}
      <Dialog open={showSceneCompletionDialog} onOpenChange={setShowSceneCompletionDialog}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Scene Completed!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2">You&#39;ve discovered all the clues in this location. Excellent detective work!</p>
            <p>Ready to continue your investigation in another location?</p>
          </div>
          <DialogFooter>
            <Button
              onClick={handleMoveToNextScene}
              className="bg-green-600 hover:bg-green-500"
            >
              Continue to Next Scene
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Custom Image Prompt Dialog */}
      <Dialog open={showImagePromptDialog} onOpenChange={setShowImagePromptDialog}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Generate Scene Image</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">Enter a custom prompt to generate an image for this scene, or leave blank to use the default description.</p>
            <Textarea
              value={customImagePrompt}
              onChange={(e) => setCustomImagePrompt(e.target.value)}
              placeholder={`Generate an image for ${currentScene.name}`}
              className="w-full p-3 bg-gray-700 text-white border-gray-600 rounded-lg"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => handleGenerateSceneImage(customImagePrompt || undefined)}
              disabled={isGeneratingImage}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {isGeneratingImage ? <Spinner size="sm" /> : "Generate Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 