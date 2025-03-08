"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Define types for our game state
export type Clue = {
  id: string;
  name: string;
  description: string;
  discovered: boolean;
  examined: boolean;
  content?: string;
};

export type GameScene = {
  id: string;
  name: string;
  description: string;
  backgroundImage: string;
  availableClues: string[]; // IDs of clues available in this scene
};

export type GameState = {
  currentScene: GameScene;
  allScenes: GameScene[];
  allClues: Clue[];
  playerNotes: string;
  gameProgress: number; // 0-100 percentage
  gameStarted: boolean;
  gameCompleted: boolean;
};

// Define the context type
type GameContextType = {
  gameState: GameState;
  startGame: () => void;
  resetGame: () => void;
  discoverClue: (clueId: string) => void;
  examineClue: (clueId: string) => void;
  updatePlayerNotes: (notes: string) => void;
  changeScene: (sceneId: string) => void;
  completeGame: () => void;
};

// Create the context with a default value
const GameContext = createContext<GameContextType | undefined>(undefined);

// Initial game state
const initialGameState: GameState = {
  currentScene: {
    id: "study",
    name: "Detective's Study",
    description: "A dimly lit study filled with antique furniture, old books, and secret compartments.",
    backgroundImage: "/images/study-room.jpg",
    availableClues: ["drawer", "painting", "letters"],
  },
  allScenes: [
    {
      id: "study",
      name: "Detective's Study",
      description: "A dimly lit study filled with antique furniture, old books, and secret compartments.",
      backgroundImage: "/images/study-room.jpg",
      availableClues: ["drawer", "painting", "letters"],
    },
    {
      id: "library",
      name: "Mansion Library",
      description: "A vast library with towering bookshelves and a mysterious atmosphere.",
      backgroundImage: "/images/library.jpg",
      availableClues: ["book", "desk", "window"],
    },
    {
      id: "basement",
      name: "Secret Basement",
      description: "A hidden basement discovered during your investigation, with strange symbols on the walls.",
      backgroundImage: "/images/detective-background.jpg",
      availableClues: ["symbols", "lockbox", "photograph"],
    },
  ],
  allClues: [
    {
      id: "drawer",
      name: "Locked Drawer",
      description: "A locked drawer with mysterious engravings that appears to contain something important.",
      discovered: false,
      examined: false,
      content: "Inside the drawer, you find a small key with an unusual shape and a series of numbers etched into its handle: 7-3-9. The drawer also contains a faded photograph of a woman standing in front of what appears to be the mansion's library. The date on the back reads 'June 15, 1962'.",
    },
    {
      id: "painting",
      name: "Suspicious Painting",
      description: "A painting with a hidden compartment behind it that seems slightly ajar.",
      discovered: false,
      examined: false,
      content: "Moving the painting aside reveals a small wall safe. Using the combination from the key (7-3-9), you manage to open it. Inside is a leather-bound journal filled with encrypted notes and diagrams. Several pages reference the library and what appears to be a hidden mechanism behind the main bookshelf.",
    },
    {
      id: "letters",
      name: "Old Letters",
      description: "A scattered set of old letters on a desk, some partially burned.",
      discovered: false,
      examined: false,
      content: "The letters are correspondence between the mansion's former owner and someone referred to only as 'M'. They discuss a 'valuable artifact' hidden within the house and mention that 'knowledge is the key' - perhaps a reference to the library. One partially burned letter mentions 'below the ancient texts lies the truth'.",
    },
    {
      id: "book",
      name: "Ancient Book",
      description: "A dusty tome with marked pages and unusual symbols that match those in the journal.",
      discovered: false,
      examined: false,
      content: "The book is titled 'Architectural Mysteries of the Victorian Era' and has several passages highlighted in faded yellow ink. One paragraph discusses secret rooms commonly built into mansions of this period. A bookmark is placed at a chapter about hidden mechanisms in libraries, with a hand-drawn symbol in the margin that matches one from the encrypted journal.",
    },
    {
      id: "desk",
      name: "Ornate Desk",
      description: "An ornate desk with several hidden compartments and a locked central drawer.",
      discovered: false,
      examined: false,
      content: "After some careful examination, you discover a hidden lever under the desk that unlocks the central drawer. Inside is a brass key with an ornate design and a note that reads 'When the stars align above the knowledge, the path below will reveal itself.' There's also a star-shaped indentation in the wood of the drawer that seems significant.",
    },
    {
      id: "window",
      name: "Stained Glass Window",
      description: "A window with a peculiar pattern that seems to hide a message when light shines through.",
      discovered: false,
      examined: false,
      content: "When the afternoon sun shines through the stained glass, it projects a starry pattern onto the floor. When aligned with the bookshelf mentioned in the journal, the light points to a specific book titled 'Celestial Navigation'. Pulling this book activates a mechanism, and you hear a rumbling from beneath the library floor. A secret passage to a basement has opened.",
    },
    {
      id: "symbols",
      name: "Wall Symbols",
      description: "Strange symbols etched into the basement walls in a circular pattern.",
      discovered: false,
      examined: false,
      content: "The symbols appear to be an ancient form of astronomical notation. When compared to the diagrams in the journal, they represent a specific date: June 15, 1962 - the same date as the photograph. The symbols are arranged around a circular indentation in the wall that looks like it could hold a round object.",
    },
    {
      id: "lockbox",
      name: "Antique Lockbox",
      description: "A heavy metal box with multiple locking mechanisms and the initials 'M.E.' engraved on top.",
      discovered: false,
      examined: false,
      content: "Using the brass key from the library desk, you unlock the box. Inside is a collection of newspaper clippings about the disappearance of a valuable artifact from the local museum in 1962, and a small astronomical device with movable parts. The articles mention a curator named Margaret Ellington (M.E.) who was the primary suspect but was never found.",
    },
    {
      id: "photograph",
      name: "Faded Photograph",
      description: "A larger version of the photograph found in the drawer, showing more details of the scene.",
      discovered: false,
      examined: false,
      content: "This clearer version of the photograph shows Margaret Ellington (the woman from the smaller photo) holding what appears to be the stolen artifact - a small astronomical device. In the background, barely visible, is a calendar showing the date June 15, 1962. The photograph is taken in front of one of the mansion's walls, which now has the symbols etched into it.",
    },
  ],
  playerNotes: "",
  gameProgress: 0,
  gameStarted: false,
  gameCompleted: false,
};

// Provider component
export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  // Initialize game state from localStorage if available
  useEffect(() => {
    const savedState = localStorage.getItem("mysteryRoomGameState");
    if (savedState) {
      try {
        setGameState(JSON.parse(savedState));
      } catch (error) {
        console.error("Failed to parse saved game state:", error);
      }
    }
  }, []);

  // Save game state to localStorage when it changes
  useEffect(() => {
    if (gameState.gameStarted) {
      localStorage.setItem("mysteryRoomGameState", JSON.stringify(gameState));
    }
  }, [gameState]);

  // Game actions
  const startGame = () => {
    setGameState((prev) => ({
      ...prev,
      gameStarted: true,
    }));
  };

  const resetGame = () => {
    localStorage.removeItem("mysteryRoomGameState");
    setGameState(initialGameState);
  };

  const discoverClue = (clueId: string) => {
    setGameState((prev) => {
      const updatedClues = prev.allClues.map((clue) =>
        clue.id === clueId ? { ...clue, discovered: true } : clue
      );
      
      // Calculate new progress
      const discoveredCount = updatedClues.filter((c) => c.discovered).length;
      const totalClues = updatedClues.length;
      const newProgress = Math.floor((discoveredCount / totalClues) * 50); // Discovering is 50% of progress
      
      return {
        ...prev,
        allClues: updatedClues,
        gameProgress: newProgress,
      };
    });
  };

  const examineClue = (clueId: string) => {
    setGameState((prev) => {
      const updatedClues = prev.allClues.map((clue) =>
        clue.id === clueId ? { ...clue, examined: true } : clue
      );
      
      // Calculate new progress
      const examinedCount = updatedClues.filter((c) => c.examined).length;
      const totalClues = updatedClues.length;
      const discoveryProgress = Math.floor((updatedClues.filter((c) => c.discovered).length / totalClues) * 50);
      const examinationProgress = Math.floor((examinedCount / totalClues) * 50); // Examining is the other 50%
      
      return {
        ...prev,
        allClues: updatedClues,
        gameProgress: discoveryProgress + examinationProgress,
      };
    });
  };

  const updatePlayerNotes = (notes: string) => {
    setGameState((prev) => ({
      ...prev,
      playerNotes: notes,
    }));
  };

  const changeScene = (sceneId: string) => {
    setGameState((prev) => {
      const newScene = prev.allScenes.find((scene) => scene.id === sceneId);
      if (!newScene) return prev;
      
      return {
        ...prev,
        currentScene: newScene,
      };
    });
  };

  const completeGame = () => {
    setGameState((prev) => ({
      ...prev,
      gameCompleted: true,
      gameProgress: 100,
    }));
  };

  // Create the context value
  const contextValue: GameContextType = {
    gameState,
    startGame,
    resetGame,
    discoverClue,
    examineClue,
    updatePlayerNotes,
    changeScene,
    completeGame,
  };

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
}

// Custom hook to use the game context
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
} 