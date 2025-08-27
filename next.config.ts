import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(
        "@next/swc-linux-x64-gnu",
        "@next/swc-linux-x64-musl"
      );
    }
    return config;
  },
};

export default nextConfig;
