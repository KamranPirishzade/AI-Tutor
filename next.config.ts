import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Without this, Turbopack picks up a stray pnpm-lock.yaml in the parent
    // user directory and infers the wrong workspace root.
    root: path.join(__dirname),
  },
};

export default nextConfig;
