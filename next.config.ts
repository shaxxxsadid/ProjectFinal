import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pino-pretty', 'thread-stream'],
};

export default nextConfig;
