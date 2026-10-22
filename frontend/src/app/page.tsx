"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function RootRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? "/projects" : "/login");
  }, [isLoading, user, router]);

  return null;
}

export default function Home() {
  return (
    <AuthProvider>
      <RootRedirect />
    </AuthProvider>
  );
}
