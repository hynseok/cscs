import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/gemini',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8080'}/gemini`,
      },
    ];
  },
};

export default nextConfig;
