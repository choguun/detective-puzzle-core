"use client";

import { GameScene } from "./game-context";

// Types for image generation responses
export interface ImageGenerationResponse {
  success: boolean;
  imageUrl: string;
  error?: string;
  revisedPrompt?: string;
}

// Default image styles for different scene types
const SCENE_STYLES = {
  study: "realistic, moody lighting, detailed, Sherlock Holmes style detective study",
  library: "atmospheric, dark academia, mysterious library with tall bookshelves",
  basement: "dark, atmospheric, mysterious basement, subtle horror elements",
  default: "cinematic, detective noir, atmospheric, high detail"
};

/**
 * Generates an image based on the scene description using OpenAI's DALL-E API
 * Falls back to placeholder images if API call fails
 */
export async function generateSceneImage(scene: GameScene, customPrompt?: string): Promise<ImageGenerationResponse> {
  // Extract scene type early so it's available in all code paths
  const sceneType = scene.id.toLowerCase();
  
  try {
    // Construct a detailed prompt based on scene description
    const basePrompt = customPrompt || scene.description;
    
    // Add style based on scene type
    const styleModifier = SCENE_STYLES[sceneType as keyof typeof SCENE_STYLES] || SCENE_STYLES.default;
    
    // Build the complete prompt with style guidance
    const fullPrompt = `${basePrompt}. ${styleModifier}. No text or watermarks. A detailed scene for a detective mystery game.`;
    
    console.log("Generating image with prompt:", fullPrompt);
    
    // Check if we have API key in environment
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn("No OpenAI API key found in environment variables. Please set NEXT_PUBLIC_OPENAI_API_KEY in your .env file.");
      return getFallbackImage(sceneType);
    }
    
    try {
      // Make the API request to OpenAI's DALL-E 3
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: fullPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "url"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Save the image URL and revised prompt
      return {
        success: true,
        imageUrl: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt
      };
    } catch (apiError) {
      console.error("OpenAI API error:", apiError);
      // Fall back to placeholder images
      return getFallbackImage(sceneType);
    }
  } catch (error) {
    console.error("Failed to generate scene image:", error);
    return getFallbackImage(sceneType);
  }
}

/**
 * Returns a fallback image when API generation fails
 */
function getFallbackImage(sceneType: string): ImageGenerationResponse {
  // For demo purposes, return a placeholder image based on scene type
  const placeholderImages = {
    study: "/scenes/study-room.jpg",
    library: "/scenes/library.jpg",
    basement: "/scenes/basement.jpg",
    default: "/scenes/default-scene.jpg"
  };
  
  // Get the appropriate placeholder image
  const imageUrl = placeholderImages[sceneType as keyof typeof placeholderImages] || 
                   placeholderImages.default;
  
  return {
    success: true,
    imageUrl,
    error: "Using fallback image due to API error or missing API key"
  };
}

/**
 * Function to enhance a prompt with more detail for better image generation
 */
export function enhanceImagePrompt(basePrompt: string): string {
  const detailEnhancements = [
    "highly detailed",
    "dramatic lighting",
    "atmospheric",
    "cinematic",
    "photorealistic",
    "8k resolution"
  ];
  
  // Randomly select 2-3 enhancements
  const selectedEnhancements = [];
  const numEnhancements = Math.floor(Math.random() * 2) + 2; // 2-3 enhancements
  
  for (let i = 0; i < numEnhancements; i++) {
    const randomIndex = Math.floor(Math.random() * detailEnhancements.length);
    selectedEnhancements.push(detailEnhancements[randomIndex]);
    detailEnhancements.splice(randomIndex, 1); // Remove to avoid duplicates
  }
  
  return `${basePrompt}, ${selectedEnhancements.join(", ")}`;
} 