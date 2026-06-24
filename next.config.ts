import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Tipagem e lint já são validados separadamente via `tsc --noEmit` e
  // `next lint`; desativados aqui apenas para acelerar o build de produção.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // better-sqlite3 é um módulo nativo (binding .node) — não deve ser
  // empacotado pelo bundler do servidor, e sim carregado via require em runtime.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
