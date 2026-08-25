import { AdminGuard } from "@/features/auth/components/admin-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
