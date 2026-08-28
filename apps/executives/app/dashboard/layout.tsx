import { ProtectedRoute } from "@repo/ui/components/Auth/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["executive", "admin"]}>
      {children}
    </ProtectedRoute>
  );
}
