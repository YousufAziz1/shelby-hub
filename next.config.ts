import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@shelby-protocol/sdk", "@aptos-labs/ts-sdk"], // Ensure protocol SDKs are correctly transpiled
};

export default nextConfig;
