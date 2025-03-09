"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types for the action prompts
interface ActionPrompt {
  id: string;
  category: string;
  text: string;
  description?: string;
}

// Common action categories
const ACTION_CATEGORIES = [
  'Investigate',
  'Examine',
  'Interact',
  'Question',
  'Custom'
];

// Common action prompts for different scenes
const COMMON_PROMPTS: Record<string, ActionPrompt[]> = {
  study: [
    { id: 'study-1', category: 'Investigate', text: 'Look for hidden compartments in the desk', description: 'Search for secret drawers or hidden mechanisms' },
    { id: 'study-2', category: 'Investigate', text: 'Check the bookshelf for any books that stand out', description: 'Examine the books for clues or hidden objects' },
    { id: 'study-3', category: 'Examine', text: 'Look closely at the painting on the wall', description: 'Inspect the details of the artwork' },
    { id: 'study-4', category: 'Interact', text: 'Open the locked drawer using a key', description: 'Try to unlock any locked containers' },
    { id: 'study-5', category: 'Interact', text: 'Move the rug to check underneath', description: 'Check if anything is hidden beneath' },
  ],
  library: [
    { id: 'library-1', category: 'Investigate', text: 'Search for books on the victim', description: 'Look for any books related to the case' },
    { id: 'library-2', category: 'Investigate', text: 'Check for any misplaced books or gaps', description: 'Look for unusual patterns in the shelves' },
    { id: 'library-3', category: 'Examine', text: 'Examine the desk for any notes or papers', description: 'Look for clues in written materials' },
    { id: 'library-4', category: 'Interact', text: 'Pull on suspicious-looking books', description: 'Try to find hidden mechanisms' },
    { id: 'library-5', category: 'Interact', text: 'Look for hidden passages behind the bookshelves', description: 'Check if any shelves can be moved' },
  ],
  basement: [
    { id: 'basement-1', category: 'Investigate', text: 'Inspect the wall symbols carefully', description: 'Try to decipher what the symbols might mean' },
    { id: 'basement-2', category: 'Investigate', text: 'Look for hidden compartments in the walls', description: 'Check for irregularities in the wall structure' },
    { id: 'basement-3', category: 'Examine', text: 'Examine the strange markings on the floor', description: 'Look closely at any patterns or designs' },
    { id: 'basement-4', category: 'Interact', text: 'Try to arrange objects based on the symbols', description: 'Experiment with object placement' },
    { id: 'basement-5', category: 'Interact', text: 'Check for loose stones or bricks', description: 'Look for structural anomalies' },
  ],
};

// For any scene, provide these general prompts
const GENERAL_PROMPTS: ActionPrompt[] = [
  { id: 'general-1', category: 'Investigate', text: 'Search the room thoroughly', description: 'Conduct a careful sweep of the entire area' },
  { id: 'general-2', category: 'Examine', text: 'Look for fingerprints or other evidence', description: 'Check surfaces for traces' },
  { id: 'general-3', category: 'Question', text: 'What is the history of this place?', description: 'Ask about the background of the location' },
  { id: 'general-4', category: 'Question', text: 'Who has access to this area?', description: 'Determine who might have been here' },
  { id: 'general-5', category: 'Question', text: 'What might be important in this scene?', description: 'Get hints about key elements' },
];

interface ActionPromptLibraryProps {
  sceneId: string;
  onSubmitAction: (action: string) => void;
  isProcessing: boolean;
}

export default function ActionPromptLibrary({ 
  sceneId, 
  onSubmitAction, 
  isProcessing 
}: ActionPromptLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Investigate');
  const [customAction, setCustomAction] = useState<string>('');
  const [actionHistory, setActionHistory] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Get scene-specific prompts or fall back to general ones
  const getPrompts = (): ActionPrompt[] => {
    const scenePrompts = COMMON_PROMPTS[sceneId.toLowerCase()] || [];
    const filteredScenePrompts = scenePrompts.filter(p => p.category === selectedCategory);
    const filteredGeneralPrompts = GENERAL_PROMPTS.filter(p => p.category === selectedCategory);
    
    return [...filteredScenePrompts, ...filteredGeneralPrompts];
  };

  // Handle selecting a prompt
  const handleSelectPrompt = (promptText: string) => {
    if (isProcessing) return;
    onSubmitAction(promptText);
    addToHistory(promptText);
    setIsOpen(false);
  };

  // Handle submitting a custom action
  const handleSubmitCustomAction = () => {
    if (!customAction.trim() || isProcessing) return;
    onSubmitAction(customAction);
    addToHistory(customAction);
    setCustomAction('');
    setIsOpen(false);
  };

  // Add action to history
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitCustomAction();
    }
  };

  // Store action in history
  const addToHistory = (action: string) => {
    setActionHistory(prev => {
      // Don't add duplicates of the most recent action
      if (prev[0] === action) return prev;
      return [action, ...prev.slice(0, 9)]; // Keep last 10 actions
    });
  };

  return (
    <div className="relative">
      {/* Quick action input */}
      <div className="flex items-center gap-2 mt-4">
        <Input
          value={customAction}
          onChange={(e) => setCustomAction(e.target.value)}
          placeholder="Type an action to take in this scene..."
          className="flex-grow"
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
        />
        <Button 
          onClick={handleSubmitCustomAction}
          disabled={!customAction.trim() || isProcessing}
        >
          {isProcessing ? "Processing..." : "Investigate"}
        </Button>
        <Button 
          variant="outline"
          onClick={() => setIsOpen(true)}
          disabled={isProcessing}
        >
          Prompt Library
        </Button>
      </div>

      {/* Recently used actions */}
      {actionHistory.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-1">Recent actions:</p>
          <div className="flex flex-wrap gap-1">
            {actionHistory.slice(0, 5).map((action, index) => (
              <button
                key={index}
                className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
                onClick={() => handleSelectPrompt(action)}
                disabled={isProcessing}
              >
                {action.length > 30 ? action.substring(0, 27) + '...' : action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prompt library dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detective Action Library</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="Investigate" value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-5">
              {ACTION_CATEGORIES.map(category => (
                <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
              ))}
            </TabsList>
            
            {ACTION_CATEGORIES.map(category => (
              <TabsContent key={category} value={category} className="mt-4">
                {category === 'Custom' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Create a custom investigation action:
                    </p>
                    <Textarea
                      value={customAction}
                      onChange={(e) => setCustomAction(e.target.value)}
                      placeholder="Describe your action in detail..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Be specific about what you want to investigate or interact with in the scene.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-72">
                    <div className="grid grid-cols-1 gap-2">
                      {getPrompts().map(prompt => (
                        <button
                          key={prompt.id}
                          className="flex flex-col items-start p-3 rounded-md hover:bg-accent text-left transition-colors"
                          onClick={() => handleSelectPrompt(prompt.text)}
                        >
                          <span className="font-medium">{prompt.text}</span>
                          {prompt.description && (
                            <span className="text-xs text-muted-foreground mt-1">{prompt.description}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            ))}
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {selectedCategory === 'Custom' && (
              <Button 
                onClick={handleSubmitCustomAction} 
                disabled={!customAction.trim() || isProcessing}
              >
                Submit Action
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 