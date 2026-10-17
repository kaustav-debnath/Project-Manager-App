"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BoardProvider } from "@/context/BoardContext";
import { BoardHeader } from "@/components/BoardHeader";
import { Board } from "@/components/Board";
import { LogoutButton } from "@/components/LogoutButton";

function AuthenticatedBoard() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <BoardProvider>
      <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#070b14] transition-colors">
        <BoardHeader />
        <div className="flex items-center justify-end px-6 py-2 border-b border-slate-200 dark:border-slate-800">
          <LogoutButton />
        </div>
        <Board />
      </main>
    </BoardProvider>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthenticatedBoard />
      </AuthProvider>
    </ThemeProvider>
  );
}
