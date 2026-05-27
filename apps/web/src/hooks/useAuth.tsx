import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type User } from "@/lib/api";

interface AuthCtx {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [token, setToken] = useState(() => localStorage.getItem("rald_token"));

  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/auth/me"),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (isError) handleLogout();
  }, [isError]);

  const login = (t: string) => {
    localStorage.setItem("rald_token", t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem("rald_token");
    setToken(null);
    qc.clear();
  };

  return (
    <Ctx.Provider value={{ user: user ?? null, isLoading: isLoading && !!token, login, logout: handleLogout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
