import type { Metadata } from "next";
import DiscoveryJourney from "./discovery-journey";

export const metadata: Metadata = {
  title: "RePlate · Explore groceries",
  description: "Explore nearby supermarkets by NYC ZIP code and straight-line radius.",
};

export default function ExplorePage() {
  return <DiscoveryJourney />;
}
