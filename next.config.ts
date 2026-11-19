import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The seed JSON lives in /data and is imported by server code, so it is bundled automatically.
};

export default nextConfig;
