import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixa a raiz do projeto (há um package-lock.json solto em pasta superior em algumas máquinas).
  turbopack: { root: process.cwd() },
};

export default nextConfig;
