import type { Metadata } from "next";
import InfoContent from "./info-content";

export const metadata: Metadata = {
  title: "Hiraku · SNAP information",
  description: "Understand NYC's October 2026 SNAP work-rule reset and find official next steps.",
};

export default function InfoPage() {
  return <InfoContent />;
}
