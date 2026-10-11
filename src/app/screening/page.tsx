import type { Metadata } from "next";
import ScreeningPageContent from "./screening-page-content";

export const metadata: Metadata = {
  title: "Hiraku · SNAP screening",
  description: "Check a limited NYC SNAP income guideline, understand your result, and prepare your next step.",
};

export default function ScreeningPage() {
  return <ScreeningPageContent />;
}
