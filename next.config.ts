import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActionsBodySizeLimit: '10mb',
  },
};

export default nextConfig;
