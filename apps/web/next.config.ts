import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@invoiceflow/api-client",
    "@invoiceflow/calculations",
    "@invoiceflow/design-tokens",
  ],
};

export default nextConfig;
