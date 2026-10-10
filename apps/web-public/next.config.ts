import type { NextConfig } from "next";

/** Host do Supabase (de NEXT_PUBLIC_SUPABASE_URL), para o next/image aceitar as fotos do Storage. */
function supabaseHost(): string | null {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
}

const host = supabaseHost();

const nextConfig: NextConfig = {
  transpilePackages: ["@amemais/shared-types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
      // Só o caminho público do Storage (bucket animal-photos), nada além disso.
      ...(host ? [{ protocol: "https" as const, hostname: host, pathname: "/storage/v1/object/public/**" }] : []),
    ],
  },
};

export default nextConfig;
