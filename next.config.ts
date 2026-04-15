import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@elevenlabs/elevenlabs-js'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
