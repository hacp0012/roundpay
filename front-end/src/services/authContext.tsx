import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { mockApi } from './mockApi';
import { getQuestToken, setQuestToken } from './questClient';
import { secureStorage } from './storage';

interface AuthSession {
  userId: string;
  role: 'admin' | 'member';
  timestamp: number;
}

interface AuthContextType {
  currentUser: User | null;
  role: 'admin' | 'member' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginClient: (phone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'auth_session_v2';

function sessionRole(user: User): 'admin' | 'member' {
  return user.role === 'admin' ? 'admin' : 'member';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'member' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        if (!getQuestToken()) {
          secureStorage.remove(AUTH_STORAGE_KEY);
          return;
        }

        const user = await mockApi.me();
        if (user) {
          const nextRole = sessionRole(user);
          setCurrentUser(user);
          setRole(nextRole);
          secureStorage.set<AuthSession>(AUTH_STORAGE_KEY, {
            userId: user.id,
            role: nextRole,
            timestamp: Date.now(),
          });
        } else {
          setQuestToken(null);
          secureStorage.remove(AUTH_STORAGE_KEY);
        }
      } catch (err) {
        console.error('Session restore error:', err);
        setQuestToken(null);
        secureStorage.remove(AUTH_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loginClient = async (phone: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const user = await mockApi.loginClient(phone, pin);
      if (!user) {
        return {
          success: false,
          error: 'Numéro de téléphone ou code PIN incorrect. Veuillez vérifier ou contacter votre administrateur.',
        };
      }

      const nextRole = sessionRole(user);
      setCurrentUser(user);
      setRole(nextRole);
      secureStorage.set<AuthSession>(AUTH_STORAGE_KEY, {
        userId: user.id,
        role: nextRole,
        timestamp: Date.now(),
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: "Une erreur réseau est survenue lors de l'authentification." };
    } finally {
      setIsLoading(false);
    }
  };

  const loginAdmin = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const admin = await mockApi.loginAdmin(username, password);
      if (!admin) {
        return {
          success: false,
          error: 'Identifiant administrateur ou mot de passe incorrect.',
        };
      }

      const nextRole = sessionRole(admin);
      setCurrentUser(admin);
      setRole(nextRole);
      secureStorage.set<AuthSession>(AUTH_STORAGE_KEY, {
        userId: admin.id,
        role: nextRole,
        timestamp: Date.now(),
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erreur lors de la connexion administrateur.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    void mockApi.logout();
    setCurrentUser(null);
    setRole(null);
    secureStorage.remove(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated: !!currentUser,
        isLoading,
        loginClient,
        loginAdmin,
        logout,
        setCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
