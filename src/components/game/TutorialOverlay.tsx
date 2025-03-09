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
  const { isGameStarted, completeTutorial } = useGame();

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
      description: "You'll need to take actions to discover clues. Type detective actions like 'examine the desk' or 'look at the painting'.",
      position: "bottom",
      targetElement: "clues-container",
      action: "Next"
    },
    {
      title: "Taking Actions",
      description: "Type your detective actions here to investigate objects and discover clues. Be specific about what you want to examine.",
      position: "bottom",
      targetElement: "action-input",
      action: "Next"
    },
    {
      title: "Your Notebook",
      description: "Click the notebook button to access your detective's notes and store your thoughts about the case.",
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
      description: "Find all the clues in each scene to solve the mystery. Each scene has 5 hidden clues to discover.",
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
      completeTutorial();
      onComplete();
    }
  };

  // Skip the tutorial
  const handleSkip = () => {
    setIsVisible(false);
    completeTutorial();
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
    
    // Find the element in the DOM
    const element = document.getElementById(targetElement);
    if (!element) return null;
    
    // Get element position
    const rect = element.getBoundingClientRect();
    
    return (
      <div 
        className="absolute border-2 border-primary animate-pulse rounded-md"
        style={{
          top: `${rect.top - 4}px`,
          left: `${rect.left - 4}px`,
          width: `${rect.width + 8}px`,
          height: `${rect.height + 8}px`,
          zIndex: 40,
          pointerEvents: "none"
        }}
      />
    );
  };

  if (!isVisible || !isGameStarted) return null;

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