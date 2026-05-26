import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@fitflow/ui", "@fitflow/utils", "@fitflow/types"],
};

export default nextConfig;
