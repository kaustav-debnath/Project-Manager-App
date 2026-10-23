"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  async function refreshUser(): Promise<void> {
    try {
      const response = await fetch("/api/auth/status", {
        credentials: "include",
      });
      const data = await response.json();
      setUser(data.authenticated && data.user ? data.user : null);
    } catch {
      setUser(null);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Returns null on success, or the error message to show the user
  async function register(name: string, email: string, password: string): Promise<string | null> {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
        return null;
      }
      return data.detail ?? "Could not create your account";
    } catch {
      return "Could not reach the server. Please try again.";
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
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, isLoading }}>
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
