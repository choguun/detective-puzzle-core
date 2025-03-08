import { NextRequest, NextResponse } from "next/server";
import { GameState } from "@/lib/game-context";

// In a real application, this would be stored in a database
const savedGameStates: Record<string, GameState> = {};

export async function POST(req: NextRequest) {
  try {
    const { gameState, userId } = await req.json();

    if (!gameState || !userId) {
      return NextResponse.json(
        { error: "Game state and user ID are required" },
        { status: 400 }
      );
    }

    // Save the game state
    savedGameStates[userId] = gameState;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving game state:", error);
    return NextResponse.json(
      { error: "Failed to save game state" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get the saved game state
    const gameState = savedGameStates[userId];

    if (!gameState) {
      return NextResponse.json(
        { error: "No saved game state found for this user" },
        { status: 404 }
      );
    }

    return NextResponse.json({ gameState });
  } catch (error) {
    console.error("Error loading game state:", error);
    return NextResponse.json(
      { error: "Failed to load game state" },
      { status: 500 }
    );
  }
} 