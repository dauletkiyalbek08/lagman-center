import { AdminPanel } from "@/components/staff/admin/admin-panel";
import { StaffGuard } from "@/components/staff/staff-guard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Панель администратора",
};

export default function AdminPage() {
  return (
    <StaffGuard allow={["admin"]}>
      <AdminPanel />
    </StaffGuard>
  );
}
