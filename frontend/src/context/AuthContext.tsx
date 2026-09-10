import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'SALES' | 'WAREHOUSE' | 'ADMIN' | 'ACCOUNTS') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Restore session from Supabase on page reload
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem('access_token', session.access_token);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } else if (session) {
        localStorage.setItem('access_token', session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      localStorage.setItem('access_token', data.session!.access_token);

      // Fetch profile from our API
      const { default: api } = await import('../lib/api');
      const res = await api.get('/auth/me');
      const profile: User = res.data;
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'SALES' | 'WAREHOUSE' | 'ADMIN' | 'ACCOUNTS'
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });
      if (error) throw error;

      if (data.session) {
        localStorage.setItem('access_token', data.session.access_token);
        const { default: api } = await import('../lib/api');
        const res = await api.post('/auth/profile', {
          full_name: fullName,
          email,
          role,
        });
        const profile: User = res.data;
        setUser(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
