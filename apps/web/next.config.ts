import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@invoiceflow/api-client",
    "@invoiceflow/design-tokens",
  ],
};

export default nextConfig;
