import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/**
 * Storage do Supabase (de NEXT_PUBLIC_SUPABASE_URL), para o next/image aceitar as fotos.
 * Protocolo e porta vêm da URL: no Supabase local é http://127.0.0.1:54321 (testes e2e).
 * Só o caminho público do Storage (bucket animal-photos), nada além disso.
 */
function supabaseStoragePattern(): RemotePattern | null {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    return {
      protocol: url.protocol === "http:" ? "http" : "https",
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return null;
  }
}

const storage = supabaseStoragePattern();

const nextConfig: NextConfig = {
  transpilePackages: ["@amemais/shared-types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
      ...(storage ? [storage] : []),
    ],
  },
};

export default nextConfig;
