"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth, signInWithPopup, googleProvider, onAuthStateChanged } from "@/lib/firebase";
import { seedData } from "@/lib/base44Client";

const AuthContext = createContext<{ user: any; loading: boolean; handleLogin: () => void }>({
  user: null,
  loading: true,
  handleLogin: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const seededUsers = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && !seededUsers.current.has(currentUser.uid)) {
        seededUsers.current.add(currentUser.uid);
        try {
          await seedData(currentUser.uid);
        } catch (error) {
          console.error("Seeding failed:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#ff007f] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,0,127,0.5)]" />
        <h1 className="text-3xl font-black text-[#ff007f] tracking-tighter drop-shadow-[0_0_8px_rgba(255,0,127,0.4)]">
          Casita
        </h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center hover:-translate-y-1 transition-transform duration-300">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform rotate-3">
            <span className="text-4xl text-white">🏠</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Welcome to Casita</h1>
          <p className="text-gray-500 mb-8 text-sm font-medium">Log in to track family chores and earn rewards.</p>
          <button
            onClick={handleLogin}
            className="w-full py-4 px-6 bg-gray-900 text-white font-black rounded-xl shadow-lg hover:bg-gray-800 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-md flex items-center justify-center space-x-2"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, handleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
