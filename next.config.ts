import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixa a raiz do projeto (há um package-lock.json solto em pasta superior em algumas máquinas).
  turbopack: { root: process.cwd() },
  experimental: {
    // Com o cache em disco do dev reaproveitado entre reinícios, as rotas
    // /admin/produtos/[id]/precos/** passavam a responder 404 até o arquivo ser editado
    // (Next 16.3.8, Windows). O build de produção não é afetado.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
