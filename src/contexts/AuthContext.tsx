import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  role: "user" | "shelter" | "admin";
  lang: string;
  email_verified: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.me()
      .then((data: unknown) => {
        const d = data as { user: User };
        setUser(d.user);
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(email: string, password: string) {
    const data = (await api.login({ email, password })) as { token: string; user: User };
    localStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function register(payload: { email: string; password: string; name: string; role: string }) {
    const data = (await api.register(payload)) as { token: string; user: User };
    localStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function logout() {
    await api.logout().catch(() => {});
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  }

  async function updateUser(data: Partial<User>) {
    const res = (await api.updateMe(data)) as { user: User };
    setUser(res.user);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
