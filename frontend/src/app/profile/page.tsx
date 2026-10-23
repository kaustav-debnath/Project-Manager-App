"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProfilePage } from "@/components/ProfilePage";

export default function ProfileRoute() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    </ThemeProvider>
  );
}
