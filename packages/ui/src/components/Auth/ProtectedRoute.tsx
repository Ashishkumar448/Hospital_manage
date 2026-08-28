"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectPath?: string;
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectPath = "/login",
}: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectPath);
      } else if (role && !allowedRoles.includes(role)) {
        // User is logged in but doesn't have the right role
        // For now, redirect them back to login or an unauthorized page
        router.push(redirectPath);
      }
    }
  }, [user, role, loading, router, allowedRoles, redirectPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If we have a user and they have an allowed role, render the children
  if (user && role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  // Otherwise render nothing while the redirect happens
  return null;
};
