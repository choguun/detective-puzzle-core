"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface HelpMenuProps {
  onStartTutorial: () => void;
}

export default function HelpMenu({ onStartTutorial }: HelpMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-sm">
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detective&apos;s Handbook</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="how-to-play">
          <TabsList className="mb-4">
            <TabsTrigger value="how-to-play">How to Play</TabsTrigger>
            <TabsTrigger value="techniques">Detective Techniques</TabsTrigger>
            <TabsTrigger value="controls">Game Controls</TabsTrigger>
          </TabsList>
          
          <TabsContent value="how-to-play" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Getting Started</h3>
              <p>Welcome to Mystery Room: The Detective&apos;s Case, an interactive detective puzzle game where you&apos;ll solve a mysterious case using your detective skills.</p>
              
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li><strong>Start the Game</strong>: Click the &quot;Begin Investigation&quot; button on the main screen to start your case.</li>
                <li><strong>Explore Scenes</strong>: You&apos;ll begin in the Detective&apos;s Study. Read the scene description carefully for clues about what to investigate.</li>
                <li><strong>Discover Clues</strong>: Click on objects in the scene to discover clues. Undiscovered clues are labeled as &quot;Unknown Object&quot;.</li>
                <li><strong>Examine Evidence</strong>: After discovering a clue, click &quot;Examine Closely&quot; to analyze it in detail.</li>
                <li><strong>Take Notes</strong>: Use your Detective&apos;s Notebook to record your thoughts and theories.</li>
                <li><strong>Navigate Scenes</strong>: Use the navigation buttons to move between different scenes to find more evidence.</li>
                <li><strong>Analyze Evidence</strong>: In your notebook, click &quot;Analyze Evidence&quot; after discovering several clues to get insights.</li>
                <li><strong>Solve the Case</strong>: Once you&apos;ve examined at least 3 clues, click &quot;Solve the Case&quot; to reach a conclusion.</li>
              </ol>
              
              <div className="flex justify-center mt-4">
                <Button onClick={() => {
                  setOpen(false);
                  onStartTutorial();
                }}>
                  Start Interactive Tutorial
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="techniques" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Detective Techniques</h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Close Observation</h4>
                  <p>Pay careful attention to details in scene descriptions and clue examinations. Small details often hold the key to solving the mystery.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Pattern Recognition</h4>
                  <p>Look for recurring themes, dates, names, or symbols across different clues. These patterns can reveal connections.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Deductive Reasoning</h4>
                  <p>Use logic to eliminate impossibilities and narrow down possibilities. What must be true given the evidence you&apos;ve found?</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Note Taking</h4>
                  <p>Take thorough notes about your observations and theories. Good detectives document everything.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Evidence Cross-Reference</h4>
                  <p>Use the Evidence Board to visualize connections between clues. How do they relate to each other?</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Timeline Construction</h4>
                  <p>Establish a timeline of events when possible. When did things happen relative to each other?</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Asking Questions</h4>
                  <p>For each clue, ask: Who? What? When? Where? Why? How? This helps extract maximum information.</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="controls" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Game Controls</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-3 rounded-md">
                  <h4 className="font-semibold">Scene Navigation</h4>
                  <ul className="list-disc list-inside">
                    <li>Scene Buttons: Change location</li>
                    <li>Investigate Again: Get more scene details</li>
                    <li>Detective Insights: Show helpful hints</li>
                  </ul>
                </div>
                
                <div className="border p-3 rounded-md">
                  <h4 className="font-semibold">Clue Interaction</h4>
                  <ul className="list-disc list-inside">
                    <li>Investigate Object: Discover a clue</li>
                    <li>Examine Closely: Analyze a discovered clue</li>
                    <li>Review Evidence: Re-examine a clue</li>
                  </ul>
                </div>
                
                <div className="border p-3 rounded-md">
                  <h4 className="font-semibold">Notebook Controls</h4>
                  <ul className="list-disc list-inside">
                    <li>Notes Tab: Write and view your theories</li>
                    <li>Evidence Board: See connections between clues</li>
                    <li>Analysis Tab: Review AI-generated insights</li>
                  </ul>
                </div>
                
                <div className="border p-3 rounded-md">
                  <h4 className="font-semibold">Game Functions</h4>
                  <ul className="list-disc list-inside">
                    <li>Analyze Evidence: Generate insights from clues</li>
                    <li>Solve the Case: Reach a conclusion</li>
                    <li>Light/Dark Mode: Change visual theme</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 