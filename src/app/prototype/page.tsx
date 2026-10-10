import type { Metadata } from "next";
import PrototypeJourney from "./prototype-journey";

export const metadata: Metadata = {
  title: "RePlate · UI layout draft",
  robots: { index: false, follow: false },
};

// Selected inline comparison layout, using development-only sample data.
export default function PrototypePage() {
  if (process.env.NODE_ENV === "production") {
    return <main>This UI draft is available only in the development server.</main>;
  }

  return <PrototypeJourney />;
}
