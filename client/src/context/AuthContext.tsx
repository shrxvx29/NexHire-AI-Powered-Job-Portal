import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../api/services";
import { getApiError } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role: "seeker" | "employer",
  ) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("nexhire_user");
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem("nexhire_token")),
  );
  const save = (nextUser: User, token?: string) => {
    if (token) localStorage.setItem("nexhire_token", token);
    localStorage.setItem("nexhire_user", JSON.stringify(nextUser));
    setUser(nextUser);
  };
  const refreshUser = async () => {
    const response = await authApi.me();
    save(response.data.user);
  };
  useEffect(() => {
    if (!localStorage.getItem("nexhire_token")) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(() => {
        localStorage.removeItem("nexhire_token");
        localStorage.removeItem("nexhire_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        try {
          const { data } = await authApi.login({ email, password });
          save(data.user, data.token);
          return data.user;
        } catch (e) {
          throw new Error(getApiError(e));
        }
      },
      register: async (name, email, password, role) => {
        try {
          const { data } = await authApi.register({
            name,
            email,
            password,
            role,
          });
          save(data.user, data.token);
          return data.user;
        } catch (e) {
          throw new Error(getApiError(e));
        }
      },
      logout: () => {
        localStorage.removeItem("nexhire_token");
        localStorage.removeItem("nexhire_user");
        setUser(null);
      },
      refreshUser,
    }),
    [user, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
