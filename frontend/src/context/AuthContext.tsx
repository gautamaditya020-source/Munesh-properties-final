import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { login as apiLogin, clearToken, verifyToken } from "@/src/api/client";

type AuthState = {
  isAuthed: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const ok = await verifyToken();
      setIsAuthed(ok);
      setLoading(false);
    })();
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    await apiLogin(username, password);
    setIsAuthed(true);
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setIsAuthed(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthed, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
