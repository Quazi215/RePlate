import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "../lib/i18n/client";

export const metadata: Metadata = {
  title: "Hiraku",
  description: "Understand NYC SNAP changes, find official next steps, and explore grocery options.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><LocaleProvider>{children}</LocaleProvider></body>
    </html>
  );
}
