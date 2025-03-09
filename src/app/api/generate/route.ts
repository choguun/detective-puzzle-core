import { OpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, type } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // System message based on the type of narrative
    let systemMessage = "You are a creative mystery storyteller for an interactive detective game.";
    
    switch (type) {
      case "scene_description":
        systemMessage += " Provide atmospheric, detailed descriptions that immerse the player in the mystery.";
        break;
      case "clue_examination":
        systemMessage += " Describe what the detective discovers upon examining a clue in detail.";
        break;
      case "story_progression":
        systemMessage += " Connect the discovered clues and advance the story with new questions or possibilities.";
        break;
      case "conclusion":
        systemMessage += " Provide a dramatic conclusion that ties together all the discovered clues.";
        break;
      default:
        systemMessage += " Provide engaging and immersive narrative content.";
    }

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use an appropriate model
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    // Return the response
    return NextResponse.json({
      content: response.choices[0]?.message?.content || "No response generated.",
    });
  } catch (error) {
    console.error("Error generating narrative:", error);
    return NextResponse.json(
      { error: "Failed to generate narrative" },
      { status: 500 }
    );
  }
} 