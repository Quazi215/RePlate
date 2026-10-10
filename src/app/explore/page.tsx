import type { Metadata } from "next";
import DiscoveryJourney from "./discovery-journey";

export const metadata: Metadata = {
  title: "RePlate · Explore groceries",
  description: "Explore grocery options by NYC ZIP code. Currently uses fictional sample stores.",
};

export default function ExplorePage() {
  return <DiscoveryJourney />;
}
