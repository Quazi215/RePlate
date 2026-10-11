import type { Metadata } from "next";
import DiscoveryJourney from "./discovery-journey";

export const metadata: Metadata = {
  title: "Hiraku · Explore groceries",
  description: "Explore nearby supermarket candidates by NYC ZIP code and straight-line radius. Current SNAP authorization is unverified.",
};

export default function ExplorePage() {
  return <DiscoveryJourney />;
}
