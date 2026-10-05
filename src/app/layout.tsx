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
      <body className="bg-[#0D0E10] text-[#EDEDEE] antialiased selection:bg-[#B4232A] selection:text-white">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
