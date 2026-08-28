"use client";

import { AuthProvider } from "@repo/ui/AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
