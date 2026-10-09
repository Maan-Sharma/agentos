import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";

export const metadata: Metadata = {
  title: "AgentOS — Your AI team, all in one place",
  description: "A calm, clear home for your company's AI workforce.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
