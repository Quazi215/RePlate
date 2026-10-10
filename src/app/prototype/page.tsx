import type { Metadata } from "next";
import { Suspense } from "react";
import PrototypeJourney from "./prototype-journey";

export const metadata: Metadata = {
  title: "RePlate · UI layout draft",
  robots: { index: false, follow: false },
};

// Throwaway: compare two P0 layouts at /prototype?variant=A or ?variant=B.
export default function PrototypePage() {
  if (process.env.NODE_ENV === "production") {
    return <main>This UI draft is available only in the development server.</main>;
  }

  return (
    <Suspense fallback={<main>Opening the UI draft…</main>}>
      <PrototypeJourney />
    </Suspense>
  );
}
