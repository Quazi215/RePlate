import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hiraku",
  description: "Understand NYC SNAP changes, find official next steps, and explore grocery options.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
