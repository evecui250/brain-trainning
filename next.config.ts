import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/brain-trainning',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
