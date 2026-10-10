import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RePlate",
  description: "Compare NYC SNAP shopping destinations and estimated travel costs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
