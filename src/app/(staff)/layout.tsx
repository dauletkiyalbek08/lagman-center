import { StaffTopbar } from "@/components/staff/staff-topbar";

export default function StaffLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <StaffTopbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
      </main>
    </>
  );
}
