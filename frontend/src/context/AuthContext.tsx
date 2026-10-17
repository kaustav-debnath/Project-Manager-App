"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/status", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.authenticated && data.username) {
        setUser({ username: data.username });
      }
    } catch {
      // Auth check failed - user not authenticated
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string): Promise<boolean> {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser({ username });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function logout(): Promise<void> {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors during logout
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
