import { GameProvider } from "@/lib/game-context";
import GameLayout from "@/components/game/GameLayout";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <ThemeProvider attribute="class" defaultTheme="dark">
        <GameProvider>
          <GameLayout />
          <Toaster />
        </GameProvider>
      </ThemeProvider>
    </main>
  );
}
