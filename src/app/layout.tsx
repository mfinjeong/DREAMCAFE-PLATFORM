import type { Metadata } from "next";
import "./globals.css";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const metadata: Metadata = {
  title: "DREAMCAFE - Gaming Center Management & Community Platform",
  description:
    "Professional cyber cafe, PC/console station management, live billing, cash POS, inventory, bookings, and esports community platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-[#0b0e14] text-slate-100 antialiased selection:bg-red-600 selection:text-white">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
