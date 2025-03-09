"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Game data types
export interface GameScene {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  backgroundImage?: string;
  clueIds: string[];
  completed?: boolean;
}

export interface Clue {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  sceneId: string;
  discovered: boolean;
}

export interface NoteItem {
  id: string;
  content: string;
  timestamp: number;
}

// Define initial game scenes
export const DEFAULT_SCENES: GameScene[] = [
  {
    id: "study",
    name: "Professor's Study",
    description: "The dimly lit study contains a large oak desk covered with papers, a wall of bookshelves, and several curious artifacts. A painting hangs slightly askew on the wall.",
    clueIds: ["drawer", "painting", "letters", "bookshelf", "paperweight"],
    completed: false
  },
  {
    id: "library",
    name: "University Library",
    description: "Tall bookshelves line the walls of this vast library. Dust particles dance in the beams of light from the stained glass windows. A librarian's desk stands empty.",
    clueIds: ["book", "desk", "window", "catalog", "floorboard"],
    completed: false
  },
  {
    id: "basement",
    name: "Hidden Basement",
    description: "A damp, musty basement hidden beneath the university. Strange symbols adorn the walls, and old scientific equipment fills the shelves. A single lightbulb provides minimal illumination.",
    clueIds: ["symbols", "lockbox", "photograph", "equipment", "journal"],
    completed: false
  }
];

// Define initial clues
export const DEFAULT_CLUES: Clue[] = [
  // Study clues
  {
    id: "drawer",
    name: "Locked Drawer",
    description: "A locked drawer in the professor's desk. Inside was a mysterious key with unusual markings.",
    sceneId: "study",
    discovered: false
  },
  {
    id: "painting",
    name: "Crooked Painting",
    description: "A painting hanging askew on the wall. Behind it was a small safe with a numerical code.",
    sceneId: "study",
    discovered: false
  },
  {
    id: "letters",
    name: "Threatening Letters",
    description: "A stack of letters with threatening messages sent to the professor over the past month.",
    sceneId: "study",
    discovered: false
  },
  {
    id: "bookshelf",
    name: "Disturbed Bookshelf",
    description: "A bookshelf with several books clearly moved recently. One book about ancient symbols is partially pulled out.",
    sceneId: "study",
    discovered: false
  },
  {
    id: "paperweight",
    name: "Unusual Paperweight",
    description: "A heavy crystal paperweight with strange inscriptions around its base. It seems to be more than just a decorative item.",
    sceneId: "study",
    discovered: false
  },
  
  // Library clues
  {
    id: "book",
    name: "Marked Reference Book",
    description: "A reference book on ancient civilizations with several pages marked and annotated in the professor's handwriting.",
    sceneId: "library",
    discovered: false
  },
  {
    id: "desk",
    name: "Librarian's Log",
    description: "A log book showing the professor repeatedly requested access to restricted archives late at night.",
    sceneId: "library",
    discovered: false
  },
  {
    id: "window",
    name: "Broken Window Latch",
    description: "A window with a broken latch, suggesting someone may have entered or exited the library through it.",
    sceneId: "library",
    discovered: false
  },
  {
    id: "catalog",
    name: "Modified Catalog Entry",
    description: "A library catalog entry that has been altered to hide the existence of a rare manuscript on occult practices.",
    sceneId: "library",
    discovered: false
  },
  {
    id: "floorboard",
    name: "Loose Floorboard",
    description: "A loose floorboard beneath the main reading table concealing a small notebook with coded messages.",
    sceneId: "library",
    discovered: false
  },
  
  // Basement clues
  {
    id: "symbols",
    name: "Wall Symbols",
    description: "Strange symbols drawn on the basement walls that match those in the professor's research notes.",
    sceneId: "basement",
    discovered: false
  },
  {
    id: "lockbox",
    name: "Hidden Lockbox",
    description: "A metal lockbox concealed behind some equipment containing a ritual dagger and mystical amulet.",
    sceneId: "basement",
    discovered: false
  },
  {
    id: "photograph",
    name: "Old Photograph",
    description: "A faded photograph showing the professor with an unknown group of people, all wearing matching pendants.",
    sceneId: "basement",
    discovered: false
  },
  {
    id: "equipment",
    name: "Modified Scientific Equipment",
    description: "Laboratory equipment that has been modified for unknown purposes. It appears to be designed to measure unusual energy patterns.",
    sceneId: "basement",
    discovered: false
  },
  {
    id: "journal",
    name: "Hidden Research Journal",
    description: "A leather-bound journal containing the professor's most radical theories and experiments, hidden inside a hollow brick in the wall.",
    sceneId: "basement",
    discovered: false
  }
];

// Game context state
interface GameContextState {
  currentSceneId: string | null;
  scenes: GameScene[];
  clues: Clue[];
  notes: NoteItem[];
  isGameStarted: boolean;
  isTutorialCompleted: boolean;
  gameTime: number;
  gameStartTimestamp: number | null;
  isTimerRunning: boolean;
  setCurrentSceneId: (id: string | null) => void;
  startGame: () => void;
  restartGame: () => void;
  completeTutorial: () => void;
  discoveredClueIds: string[];
  discoverClue: (clueId: string) => void;
  addNote: (content: string) => void;
  deleteNote: (id: string) => void;
  editNote: (id: string, content: string) => void;
  completeScene: (sceneId: string) => void;
  getSceneById: (id: string | null) => GameScene | undefined;
  getClueById: (id: string) => Clue | undefined;
  getCluesBySceneId: (sceneId: string) => Clue[];
  getDiscoveredCluesBySceneId: (sceneId: string) => Clue[];
  getAllDiscoveredClues: () => Clue[];
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  isSceneCompleted: (sceneId: string) => boolean;
}

// Create the context with default values
const GameContext = createContext<GameContextState | undefined>(undefined);

// Game provider props
interface GameProviderProps {
  children: ReactNode;
}

// Game context provider
export function GameProvider({ children }: GameProviderProps) {
  // State for game scenes
  const [scenes, setScenes] = useState<GameScene[]>(DEFAULT_SCENES);
  
  // State for current scene
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  
  // State for clues
  const [clues, setClues] = useState<Clue[]>(DEFAULT_CLUES);
  
  // State for player notes
  const [notes, setNotes] = useState<NoteItem[]>([]);
  
  // Game state
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [isTutorialCompleted, setIsTutorialCompleted] = useState<boolean>(false);
  
  // Timer state
  const [gameTime, setGameTime] = useState<number>(0);
  const [gameStartTimestamp, setGameStartTimestamp] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  
  // Timer function
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && gameStartTimestamp) {
      interval = setInterval(() => {
        const currentTime = Math.floor((Date.now() - gameStartTimestamp) / 1000);
        setGameTime(currentTime);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning, gameStartTimestamp]);
  
  // Get discovered clue IDs
  const discoveredClueIds = clues
    .filter(clue => clue.discovered)
    .map(clue => clue.id);
  
  // Get scene by ID
  const getSceneById = (id: string | null) => {
    if (!id) return undefined;
    return scenes.find(scene => scene.id === id);
  };
  
  // Get clue by ID
  const getClueById = (id: string) => {
    return clues.find(clue => clue.id === id);
  };
  
  // Get clues by scene ID
  const getCluesBySceneId = (sceneId: string) => {
    return clues.filter(clue => clue.sceneId === sceneId);
  };
  
  // Get discovered clues by scene ID
  const getDiscoveredCluesBySceneId = (sceneId: string) => {
    return clues.filter(clue => clue.sceneId === sceneId && clue.discovered);
  };
  
  // Get all discovered clues
  const getAllDiscoveredClues = () => {
    return clues.filter(clue => clue.discovered);
  };
  
  // Start game
  const startGame = () => {
    setIsGameStarted(true);
    setCurrentSceneId("study");
    startTimer();
  };
  
  // Restart game
  const restartGame = () => {
    setIsGameStarted(false);
    setCurrentSceneId(null);
    setClues(DEFAULT_CLUES);
    setNotes([]);
    setScenes(DEFAULT_SCENES);
    resetTimer();
  };
  
  // Complete tutorial
  const completeTutorial = () => {
    setIsTutorialCompleted(true);
  };
  
  // Discover clue
  const discoverClue = (clueId: string) => {
    setClues(prevClues => 
      prevClues.map(clue => 
        clue.id === clueId 
          ? { ...clue, discovered: true } 
          : clue
      )
    );
    
    // Check if all clues in the scene have been discovered
    const clue = clues.find(c => c.id === clueId);
    if (clue) {
      const sceneId = clue.sceneId;
      checkSceneCompletion(sceneId);
    }
  };
  
  // Check if a scene is completed
  const checkSceneCompletion = (sceneId: string) => {
    const sceneClues = getCluesBySceneId(sceneId);
    const discoveredSceneClues = getDiscoveredCluesBySceneId(sceneId);
    
    // If all clues are discovered, mark scene as completed
    if (sceneClues.length === discoveredSceneClues.length && sceneClues.length > 0) {
      completeScene(sceneId);
    }
  };
  
  // Complete a scene
  const completeScene = (sceneId: string) => {
    setScenes(prevScenes => 
      prevScenes.map(scene => 
        scene.id === sceneId 
          ? { ...scene, completed: true } 
          : scene
      )
    );
  };
  
  // Check if a scene is completed
  const isSceneCompleted = (sceneId: string) => {
    const scene = getSceneById(sceneId);
    return scene?.completed || false;
  };
  
  // Add note
  const addNote = (content: string) => {
    const newNote = {
      id: `note_${Date.now()}`,
      content,
      timestamp: Date.now()
    };
    
    setNotes(prevNotes => [...prevNotes, newNote]);
  };
  
  // Delete note
  const deleteNote = (id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
  };
  
  // Edit note
  const editNote = (id: string, content: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id 
          ? { ...note, content, timestamp: Date.now() } 
          : note
      )
    );
  };
  
  // Timer functions
  const startTimer = () => {
    if (!gameStartTimestamp) {
      setGameStartTimestamp(Date.now() - (gameTime * 1000));
    }
    setIsTimerRunning(true);
  };
  
  const pauseTimer = () => {
    setIsTimerRunning(false);
  };
  
  const resetTimer = () => {
    setIsTimerRunning(false);
    setGameStartTimestamp(null);
    setGameTime(0);
  };
  
  // Context value
  const value: GameContextState = {
    currentSceneId,
    scenes,
    clues,
    notes,
    isGameStarted,
    isTutorialCompleted,
    gameTime,
    gameStartTimestamp,
    isTimerRunning,
    setCurrentSceneId,
    startGame,
    restartGame,
    completeTutorial,
    discoveredClueIds,
    discoverClue,
    addNote,
    deleteNote,
    editNote,
    completeScene,
    getSceneById,
    getClueById,
    getCluesBySceneId,
    getDiscoveredCluesBySceneId,
    getAllDiscoveredClues,
    startTimer,
    pauseTimer,
    resetTimer,
    isSceneCompleted
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

// Custom hook to use the game context
export function useGame() {
  const context = useContext(GameContext);
  
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  
  return context;
} 