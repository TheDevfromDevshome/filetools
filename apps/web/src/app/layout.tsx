import type { Metadata } from "next";
import "./globals.css";
import { SetupGate } from "@/components/SetupGate";

export const metadata: Metadata = {
  title: "FileTools - Convert your files",
  description: "Fast. Private. Self-hosted file converter platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <SetupGate>{children}</SetupGate>
      </body>
    </html>
  );
}
