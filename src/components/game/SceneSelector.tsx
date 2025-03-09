import React from "react";
import { Button } from "@/components/ui/button";
import { GameScene } from "@/lib/game-context";

interface SceneSelectorProps {
  scenes: GameScene[];
  currentSceneId: string;
  onSceneChange: (sceneId: string) => void;
  completedScenes: Record<string, boolean>;
}

export default function SceneSelector({ 
  scenes, 
  currentSceneId, 
  onSceneChange,
  completedScenes 
}: SceneSelectorProps) {
  if (!scenes || scenes.length === 0) {
    return <p className="text-gray-400">No locations available</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {scenes.map((scene) => (
        <Button
          key={scene.id}
          onClick={() => onSceneChange(scene.id)}
          disabled={scene.id === currentSceneId}
          variant={scene.id === currentSceneId ? "secondary" : "outline"}
          className="relative justify-start"
        >
          <div className="flex items-center w-full">
            <span className={scene.id === currentSceneId ? "font-bold" : ""}>
              {scene.name}
            </span>
            
            {completedScenes[scene.id] && (
              <div className="ml-auto px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                Completed
              </div>
            )}
          </div>
        </Button>
      ))}
    </div>
  );
} 