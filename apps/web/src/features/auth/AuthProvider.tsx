"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@ai-tutor/types";
import { api } from "@/lib/api/client";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  reloadUser: () => Promise<void>;
  setAuthenticatedUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function reloadUser() {
    try {
      const result = await api<{ user: AuthUser }>("/auth/me");
      setUser(result.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

function setAuthenticatedUser(user: AuthUser) {
  setUser(user);
  setIsLoading(false);
}

async function logout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } finally {
    setUser(null);
    setIsLoading(false);
  }
}

  useEffect(() => {
    void reloadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, reloadUser, setAuthenticatedUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}


