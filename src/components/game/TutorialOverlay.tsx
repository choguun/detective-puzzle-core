"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGame } from "@/lib/game-context";

interface TutorialStep {
  title: string;
  description: string;
  position: string;
  targetElement?: string;
  action?: string;
}

export default function TutorialOverlay({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const { gameState } = useGame();

  // Define tutorial steps
  const tutorialSteps: TutorialStep[] = [
    {
      title: "Welcome, Detective!",
      description: "Welcome to Mystery Room: The Detective's Case. I'll guide you through the basics of investigating a mystery.",
      position: "center",
      action: "Next"
    },
    {
      title: "Exploring the Scene",
      description: "This is the main scene view. Read the scene description carefully for clues about what to investigate.",
      position: "top",
      targetElement: "scene-description",
      action: "Next"
    },
    {
      title: "Discovering Clues",
      description: "These are potential clues. Click on 'Investigate Object' to discover what they are.",
      position: "bottom",
      targetElement: "clues-container",
      action: "Next"
    },
    {
      title: "Your Detective's Notebook",
      description: "Click the notebook icon to access your notes, evidence board, and case analysis.",
      position: "bottom-right",
      targetElement: "notebook-toggle",
      action: "Next"
    },
    {
      title: "Scene Navigation",
      description: "Use these buttons to move between different scenes and discover more clues.",
      position: "bottom-right",
      targetElement: "scene-navigation",
      action: "Next"
    },
    {
      title: "Solving the Case",
      description: "After examining at least 3 clues, you can attempt to solve the case from your notebook.",
      position: "center",
      action: "Start Investigating"
    }
  ];

  // Move to next step or complete tutorial
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
      localStorage.setItem("tutorialCompleted", "true");
      onComplete();
    }
  };

  // Skip the tutorial
  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem("tutorialCompleted", "true");
    onComplete();
  };

  // Position the tooltip based on the current step
  const getTooltipPosition = () => {
    const { position } = tutorialSteps[currentStep];
    
    switch (position) {
      case "top":
        return "top-24 left-1/2 transform -translate-x-1/2";
      case "bottom":
        return "bottom-24 left-1/2 transform -translate-x-1/2";
      case "bottom-right":
        return "bottom-24 right-24";
      case "center":
      default:
        return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
    }
  };

  // Draw an arrow or highlight for the target element
  const getTargetHighlight = () => {
    const { targetElement } = tutorialSteps[currentStep];
    
    if (!targetElement) return null;
    
    // This is a simplified version. In a full implementation, 
    // you would get the actual element position and draw the highlight accordingly
    return (
      <div 
        className="absolute border-2 border-primary animate-pulse rounded-md"
        style={{
          // These would be calculated based on the target element's position
          top: "50%",
          left: "50%",
          width: "200px",
          height: "100px",
          zIndex: 40,
          pointerEvents: "none"
        }}
      />
    );
  };

  if (!isVisible || !gameState.gameStarted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {getTargetHighlight()}
      
      <Card className={`shadow-lg p-6 max-w-md ${getTooltipPosition()}`}>
        <h3 className="text-xl font-bold mb-2">{tutorialSteps[currentStep].title}</h3>
        <p className="mb-4">{tutorialSteps[currentStep].description}</p>
        
        <div className="flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSkip}
          >
            Skip Tutorial
          </Button>
          
          <Button 
            onClick={handleNext}
          >
            {tutorialSteps[currentStep].action || "Next"}
          </Button>
        </div>
      </Card>
    </div>
  );
} 