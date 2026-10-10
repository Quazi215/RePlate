import type { Metadata } from "next";
import PrototypeJourney from "./prototype-journey";

export const metadata: Metadata = {
  title: "RePlate · Sample discovery",
  robots: { index: false, follow: false },
};

// Map-first discovery screen, using development-only fictional fixtures.
export default function PrototypePage() {
  if (process.env.NODE_ENV === "production") {
    return <main>This UI draft is available only in the development server.</main>;
  }

  return <PrototypeJourney />;
}
