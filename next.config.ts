import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This repository lives inside a larger workspace that also has a lockfile.
  // Pinning both roots prevents Next.js from selecting the parent workspace.
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingExcludes: {
    "/*": ["./pytest-cache-files-*", "./.pytest_cache/**/*"],
  },
};

export default nextConfig;
