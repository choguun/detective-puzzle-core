"use client";

import { Clue, GameScene } from "./game-context";

export type NarrativeRequestType = 
  | "scene_description" 
  | "clue_examination" 
  | "story_progression" 
  | "conclusion"
  | "scene_action";

export interface NarrativeRequest {
  type: NarrativeRequestType;
  scene?: GameScene;
  clue?: Clue;
  discoveredClues?: Clue[];
  playerContext?: string;
  customContext?: string;
  action?: string;
}

export type NarrativeResponse = {
  content: string;
  additionalClues?: string[];
  suggestedActions?: string[];
};

// Function to generate narrative content using the LLM via our API
export async function generateNarrative(
  request: NarrativeRequest
): Promise<NarrativeResponse> {
  try {
    let prompt = "";

    // Build the prompt based on the request type
    switch (request.type) {
      case "scene_description":
        prompt = buildSceneDescriptionPrompt(request.scene!);
        break;
      case "clue_examination":
        prompt = buildClueExaminationPrompt(request.clue!, request.discoveredClues || []);
        break;
      case "story_progression":
        prompt = buildStoryProgressionPrompt(request.discoveredClues || [], request.playerContext || "");
        break;
      case "conclusion":
        prompt = buildConclusionPrompt(request.discoveredClues || [], request.playerContext || "");
        break;
      case "scene_action":
        prompt = buildSceneActionPrompt(request.action || "");
        break;
      default:
        throw new Error("Invalid narrative request type");
    }

    // Call our API route
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        type: request.type,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.content,
      additionalClues: [],
      suggestedActions: [],
    };
  } catch (error) {
    console.error("Error generating narrative:", error);
    return {
      content: "Something went wrong while generating the narrative. Please try again.",
      additionalClues: [],
      suggestedActions: [],
    };
  }
}

// Helper functions to build prompts

function buildSceneDescriptionPrompt(scene: GameScene): string {
  return `
    Describe the following scene in rich, atmospheric detail for a detective mystery game:
    
    Scene: ${scene.name}
    Basic Description: ${scene.description}
    
    Provide a detailed description that sets the mood, describes the environment, and hints at 3-5 potential clues or objects of interest that the detective might want to examine further. 
    Make the description immersive and intriguing, appealing to multiple senses.
  `;
}

function buildClueExaminationPrompt(clue: Clue, discoveredClues: Clue[]): string {
  const otherCluesContext = discoveredClues.length > 0
    ? `The detective has already discovered the following clues: ${discoveredClues.map(c => c.name).join(", ")}.`
    : "This is the first clue the detective is examining in detail.";

  return `
    The detective decides to examine the following clue in detail:
    
    Clue: ${clue.name}
    Basic Description: ${clue.description}
    
    ${otherCluesContext}
    
    Provide a detailed description of what the detective discovers upon closer examination. 
    Include subtle hints or connections to the broader mystery, but don't reveal everything at once. 
    The description should be intriguing and lead to further questions or areas to investigate.
  `;
}

function buildStoryProgressionPrompt(discoveredClues: Clue[], playerContext: string): string {
  const cluesList = discoveredClues.map(c => `${c.name}: ${c.description}`).join("\n");
  
  return `
    Based on the clues discovered so far, provide a narrative update on the mystery:
    
    Discovered Clues:
    ${cluesList}
    
    Player's Current Thoughts:
    ${playerContext}
    
    Provide a narrative that connects these clues and advances the story. 
    Introduce new questions or possibilities based on the evidence gathered. 
    Suggest potential next steps or areas to investigate without being too directive.
  `;
}

function buildConclusionPrompt(discoveredClues: Clue[], playerContext: string): string {
  const cluesList = discoveredClues.map(c => `${c.name}: ${c.description}`).join("\n");
  
  return `
    The detective is ready to solve the case based on the following clues:
    
    Discovered Clues:
    ${cluesList}
    
    Detective's Reasoning:
    ${playerContext}
    
    Provide a dramatic conclusion to the mystery that ties together all the discovered clues. 
    Reveal the solution to the case in a satisfying way that explains the connections between the various pieces of evidence. 
    The conclusion should feel earned based on the clues that were discovered.
  `;
}

function buildSceneActionPrompt(action: string): string {
  return `
    Describe the following scene action:
    
    Action: ${action}
    
    Provide a detailed description of the action and its impact on the story.
  `;
} 