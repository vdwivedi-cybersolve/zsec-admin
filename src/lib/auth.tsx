import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  verifySession,
} from "@/lib/api";

const TOKEN_KEY = "zsec_auth_token";
const LOGIN_ID_KEY = "zsec_auth_login_id";

type AuthContextValue = {
  loginId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (loginId: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStored = (key: string): string | null => {
  try {
    return typeof localStorage !== "undefined"
      ? localStorage.getItem(key)
      : null;
  } catch {
    return null;
  }
};

const writeStored = (key: string, value: string | null) => {
  try {
    if (typeof localStorage === "undefined") return;
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => readStored(TOKEN_KEY));
  const [loginId, setLoginId] = useState<string | null>(() =>
    readStored(LOGIN_ID_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);

  // Validate any persisted token on first load.
  useEffect(() => {
    let cancelled = false;
    const stored = readStored(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    verifySession(stored)
      .then((session) => {
        if (cancelled) return;
        setToken(session.token);
        setLoginId(session.loginId);
        writeStored(LOGIN_ID_KEY, session.loginId);
      })
      .catch(() => {
        if (cancelled) return;
        setToken(null);
        setLoginId(null);
        writeStored(TOKEN_KEY, null);
        writeStored(LOGIN_ID_KEY, null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (id: string, password: string) => {
    const session = await apiLogin(id, password);
    setToken(session.token);
    setLoginId(session.loginId);
    writeStored(TOKEN_KEY, session.token);
    writeStored(LOGIN_ID_KEY, session.loginId);
  }, []);

  const signOut = useCallback(async () => {
    const current = token;
    setToken(null);
    setLoginId(null);
    writeStored(TOKEN_KEY, null);
    writeStored(LOGIN_ID_KEY, null);
    if (current) {
      try {
        await apiLogout(current);
      } catch {
        // best-effort; local session is already cleared
      }
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        loginId,
        isAuthenticated: Boolean(token),
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
