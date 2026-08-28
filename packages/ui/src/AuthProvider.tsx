"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@repo/firebase";

interface AuthContextType {
  user: User | null;
  role: string | null;
  department: string | null;
  ward: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, role: null, department: null, ward: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [ward, setWard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch custom claims to get role
        const tokenResult = await currentUser.getIdTokenResult();
        setRole((tokenResult.claims.role as string) || "user");
        setDepartment((tokenResult.claims.department as string) || null);
        setWard((tokenResult.claims.ward as string) || null);
      } else {
        setRole(null);
        setDepartment(null);
        setWard(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={{ user, role, department, ward, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
