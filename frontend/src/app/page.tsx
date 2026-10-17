"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import { BoardProvider } from "@/context/BoardContext";
import { BoardHeader } from "@/components/BoardHeader";
import { Board } from "@/components/Board";

export default function Home() {
  return (
    <ThemeProvider>
      <BoardProvider>
        <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#070b14] transition-colors">
          <BoardHeader />
          <Board />
        </main>
      </BoardProvider>
    </ThemeProvider>
  );
}
