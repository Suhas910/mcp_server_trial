import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { setAuthToken, setUnauthorizedHandler, ApiError } from '../api/client';
import type { Member } from '../types';

interface AuthContextType {
  /** null while the initial /auth/me check is in flight. */
  user: Member | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  /** Applies a profile update (from ProfilePage) to the cached user without a round trip. */
  setUser: (user: Member) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// The token lives here, not localStorage — see the note in api/client.ts.
// That also means a hard refresh always logs the user out; there is no
// refresh-token endpoint to silently re-establish a session, by design for v1.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthToken(null);
      setUserState(null);
    });
    setIsLoading(false);
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setAuthToken(result.token);
    setUserState(result.user);
  };

  const register = async (input: { email: string; password: string; name: string }) => {
    const result = await authApi.register(input);
    setAuthToken(result.token);
    setUserState(result.user);
  };

  const logout = () => {
    setAuthToken(null);
    setUserState(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, login, register, logout, setUser: setUserState }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export { ApiError };
