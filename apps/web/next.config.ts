import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Necessário em monorepos: faz o file tracing incluir packages/ e gera o
  // standalone com o caminho apps/web/server.js relativo à raiz do monorepo,
  // compatível com o CMD do Dockerfile ("node apps/web/server.js").
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@fitflow/ui", "@fitflow/utils", "@fitflow/types"],
};

export default nextConfig;
