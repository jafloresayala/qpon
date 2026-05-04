import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getMe, login as apiLogin, register as apiRegister } from "@/api/auth";
import { clearStoredToken, getStoredToken } from "@/api/client";
import type { LoginPayload, RegisterPayload } from "@/api/auth";
import type { User } from "@/api/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          const me = await getMe();
          setUser(me);
        }
      } catch {
        await clearStoredToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await apiLogin(payload);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await apiRegister(payload);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await clearStoredToken();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
