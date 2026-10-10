import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    // The future server API reads these fixed files at runtime; keep them in its Vercel bundle.
    "/api/retailers": [
      "./nyc_snap_supermarkets.csv",
      "./data/location/nyc-zctas.json",
      "./data/location/nyc-boroughs.json.gz",
      "./data/fares/local-bus.json",
    ],
  },
};

export default nextConfig;
