"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    </ThemeProvider>
  );
}
