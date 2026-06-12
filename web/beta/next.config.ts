import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const internalApi = process.env.INTERNAL_API_URL;
    if (!internalApi) return [];
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${internalApi}/:path*`,
      },
    ];
  },
};

export default nextConfig;
