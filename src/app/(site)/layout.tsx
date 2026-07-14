import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TableBanner } from "@/components/table/table-banner";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteHeader />
      <div className="pt-20">
        <TableBanner />
      </div>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
