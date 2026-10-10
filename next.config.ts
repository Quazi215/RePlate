import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    // The loaders opt out of tracing configurable test paths. Include their default runtime files.
    "/api/retailers": [
      "./nyc_snap_supermarkets.csv",
      "./data/location/nyc-zctas.json",
      "./data/location/nyc-boroughs.json.gz",
    ],
  },
};

export default nextConfig;
