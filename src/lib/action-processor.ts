"use client";

import { GameScene, Clue } from "./game-context";
import { generateNarrative, NarrativeRequestType } from "./llm-service";

// Types for action processing
export interface ActionRequest {
  action: string;
  scene: GameScene;
  discoveredClues: Clue[];
  playerContext?: string;
}

export interface ActionResponse {
  content: string;
  revealedClues?: string[];
  hintGiven?: boolean;
  success?: boolean;
}

// Define scene-specific action-to-clue mappings
const SCENE_ACTION_CLUE_MAPPINGS: Record<string, Record<string, string[]>> = {
  study: {
    // Actions that might reveal the drawer clue
    "search desk": ["drawer"],
    "look at desk": ["drawer"],
    "open drawer": ["drawer"],
    "check drawers": ["drawer"],
    "investigate desk": ["drawer"],
    
    // Actions that might reveal the painting clue
    "examine painting": ["painting"],
    "look at painting": ["painting"],
    "inspect wall": ["painting"],
    "check paintings": ["painting"],
    "investigate artwork": ["painting"],
    
    // Actions that might reveal the letters clue
    "look at papers": ["letters"],
    "examine documents": ["letters"],
    "check papers": ["letters"],
    "read documents": ["letters"],
    "sort through papers": ["letters"],
  },
  
  library: {
    // Actions that might reveal the book clue
    "search bookshelf": ["book"],
    "examine books": ["book"],
    "look for unusual books": ["book"],
    "check bookshelf": ["book"],
    "inspect shelves": ["book"],
    
    // Actions that might reveal the desk clue
    "check desk": ["desk"],
    "search writing desk": ["desk"],
    "look at librarian desk": ["desk"],
    "examine desk": ["desk"],
    "inspect study area": ["desk"],
    
    // Actions that might reveal the window clue
    "look at windows": ["window"],
    "examine stained glass": ["window"],
    "inspect windows": ["window"],
    "check for light patterns": ["window"],
    "study light from windows": ["window"],
  },
  
  basement: {
    // Actions that might reveal the symbols clue
    "inspect wall markings": ["symbols"],
    "examine symbols": ["symbols"],
    "look at strange markings": ["symbols"],
    "study wall patterns": ["symbols"],
    "trace wall symbols": ["symbols"],
    
    // Actions that might reveal the lockbox clue
    "search floor": ["lockbox"],
    "check corners": ["lockbox"],
    "look for containers": ["lockbox"],
    "inspect metal box": ["lockbox"],
    "search for hidden items": ["lockbox"],
    
    // Actions that might reveal the photograph clue
    "look for pictures": ["photograph"],
    "search for photographs": ["photograph"],
    "check picture frames": ["photograph"],
    "examine photographs": ["photograph"],
    "investigate personal items": ["photograph"],
  },
};

/**
 * Process a player's action in a scene using LLM
 */
export async function processSceneAction(request: ActionRequest): Promise<ActionResponse> {
  try {
    const { action, scene, discoveredClues, playerContext } = request;
    
    // Try to match action with predefined mappings first
    const revealedClues = findCluesForAction(action, scene.id);
    
    // Create a context object for the LLM
    const prompt = {
      type: "scene_action" as NarrativeRequestType,
      scene,
      action,
      discoveredClues,
      playerContext: playerContext || "",
      customContext: `The player is performing this action: "${action}" in the ${scene.name}. 
      ${revealedClues.length > 0 ? `This action may reveal the following clues: ${revealedClues.join(", ")}.` : ""}
      Consider which clues might be discovered with this action.
      If the player discovers a clue, include CLUE_DISCOVERED:clue_id in your response.
      If you provide a hint, include HINT_GIVEN in your response.
      If the action is successful, include ACTION_SUCCESS in your response.`
    };
    
    // Use the existing narrative generation service
    const response = await generateNarrative(prompt);
    
    // Check if the response indicates any clue discoveries
    const clueMatches = response.content.match(/CLUE_DISCOVERED:([a-zA-Z0-9_,]+)/);
    const llmFoundClues = clueMatches ? clueMatches[1].split(',') : [];
    
    // Add our keyword-matched clues if not already found
    revealedClues.forEach(clueId => {
      if (!llmFoundClues.includes(clueId)) {
        llmFoundClues.push(clueId);
      }
    });
    
    // Check for hint indicators
    const hintGiven = response.content.includes("HINT_GIVEN");
    
    // Check for success indicators
    const success = response.content.includes("ACTION_SUCCESS") || llmFoundClues.length > 0;
    
    // Clean the response of any special tokens
    const cleanedContent = response.content
      .replace(/CLUE_DISCOVERED:[a-zA-Z0-9_,]+/g, '')
      .replace(/HINT_GIVEN/g, '')
      .replace(/ACTION_SUCCESS/g, '')
      .trim();
    
    // Return the final response
    return {
      content: enhanceResponseWithClueRevealed(cleanedContent, llmFoundClues),
      revealedClues: llmFoundClues,
      hintGiven,
      success
    };
  } catch (error) {
    console.error("Failed to process scene action:", error);
    return {
      content: "The detective tried that approach, but couldn't make progress. Perhaps try something else?"
    };
  }
}

/**
 * Find clues that might be discovered based on the action text
 */
function findCluesForAction(action: string, sceneId: string): string[] {
  const actionLower = action.toLowerCase();
  const sceneMapping = SCENE_ACTION_CLUE_MAPPINGS[sceneId.toLowerCase()];
  
  if (!sceneMapping) return [];
  
  // Check for direct action mappings
  for (const [actionKey, clueIds] of Object.entries(sceneMapping)) {
    if (actionLower.includes(actionKey)) {
      return clueIds;
    }
  }
  
  // Check general actions based on keywords
  const revealedClues: string[] = [];
  
  // Object-focused actions like search, examine, inspect
  if (actionLower.includes("search") || 
      actionLower.includes("examine") || 
      actionLower.includes("inspect") ||
      actionLower.includes("look at") ||
      actionLower.includes("check")) {
    
    // For each clue ID in the scene
    for (const [actionKey, clueIds] of Object.entries(sceneMapping)) {
      // Extract the object from the action key (usually the last word)
      const objectWords = actionKey.split(" ").slice(1).join(" ");
      
      // If the player's action mentions this object
      if (objectWords && actionLower.includes(objectWords)) {
        revealedClues.push(...clueIds);
      }
    }
  }
  
  return [...new Set(revealedClues)]; // Remove duplicates
}

/**
 * Enhance the response text with details about discovered clues
 */
function enhanceResponseWithClueRevealed(content: string, clueIds: string[]): string {
  if (clueIds.length === 0) return content;
  
  // For a single clue
  if (clueIds.length === 1) {
    return `${content}\n\n*You found a clue!* Examine your evidence collection to learn more.`;
  }
  
  // For multiple clues
  return `${content}\n\n*You found ${clueIds.length} clues!* Examine your evidence collection to learn more.`;
}

/**
 * Generate fallback responses when LLM is not available
 */
export function getFallbackActionResponse(action: string, scene: GameScene): ActionResponse {
  // Check if the action might reveal clues
  const revealedClues = findCluesForAction(action, scene.id);
  
  // If clues might be revealed, create a response about that
  if (revealedClues.length > 0) {
    return {
      content: `You ${action.toLowerCase()} and notice something interesting. This could be an important clue.`,
      revealedClues,
      success: true
    };
  }
  
  // Simple fallback responses for different action types
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('search') || actionLower.includes('look')) {
    return {
      content: `You carefully search the ${scene.name.toLowerCase()}. While you don't find anything immediately obvious, your detective instincts tell you to keep investigating.`
    };
  }
  
  if (actionLower.includes('examine') || actionLower.includes('inspect')) {
    return {
      content: `You examine the area closely. The details might be important to solving this case.`
    };
  }
  
  if (actionLower.includes('open') || actionLower.includes('unlock')) {
    return {
      content: `You attempt to open it, but you need to find the right approach or tool first.`
    };
  }
  
  // Default fallback
  return {
    content: `You try to ${action.toLowerCase()}, but aren't able to make progress yet. Perhaps there's another approach or you need to discover more clues first.`
  };
} 