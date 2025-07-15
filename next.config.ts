import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // TODO: Re-enable ignoreDuringBuilds after fixing all ESLint errors - Target: Next sprint
    // Currently disabled to ensure code quality during builds
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
