import React from "react";

interface GameTimerProps {
  seconds: number;
  isRunning: boolean;
  format: (seconds: number) => string;
}

export default function GameTimer({ seconds, isRunning, format }: GameTimerProps) {
  return (
    <div className="font-mono text-sm px-3 py-1 bg-gray-700 rounded-full flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
      <span>{format(seconds)}</span>
    </div>
  );
} 