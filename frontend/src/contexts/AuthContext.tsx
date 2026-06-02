"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { AuthUser, Role } from "@/types";
import {
  getUserIdFromToken,
  refreshToken as apiRefreshToken,
  setRefreshHandler,
  setSessionExpiredHandler,
} from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (data: {
    accessToken: string;
    refreshToken: string;
    email: string;
    name: string;
    role: Role[];
    departmentName: string;
  }) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "ep_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const userRef = useRef<AuthUser | null>(null);
  userRef.current = user;

  useEffect(() => {
    setRefreshHandler(async () => {
      const current = userRef.current;
      if (!current) throw new Error("Not authenticated");

      const data = await apiRefreshToken(current.refreshToken);
      if (!data) throw new Error("Refresh response was empty");

      const updated: AuthUser = {
        ...current,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
      return updated.accessToken;
    });

    setSessionExpiredHandler(() => {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    });

    return () => {
      setRefreshHandler(null);
      setSessionExpiredHandler(null);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    (data: {
      accessToken: string;
      refreshToken: string;
      email: string;
      name: string;
      role: Role[];
      departmentName: string;
    }) => {
      const authUser: AuthUser = {
        email: data.email,
        name: data.name,
        roles: data.role,
        activeRole: data.role.includes("ADMIN") ? "ADMIN" : data.role[0],
        departmentName: data.departmentName,
        userId: getUserIdFromToken(data.accessToken),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const switchRole = useCallback((role: Role) => {
    setUser((prev) => {
      if (!prev || !prev.roles.includes(role)) return prev;
      const updated = { ...prev, activeRole: role };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export type { AuthContextValue };
