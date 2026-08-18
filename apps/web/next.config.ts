import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@invoiceflow/design-tokens"],
};

export default nextConfig;
