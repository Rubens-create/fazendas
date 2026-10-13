import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const internalApi = process.env.INTERNAL_API_URL ?? 'http://localhost:3001/api';
    return [{
      source: '/api/:path*',
      destination: `${internalApi}/:path*`,
    }];
  },
};

export default nextConfig;
