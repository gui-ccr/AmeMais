import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Proteção Animal em Teófilo Otoni`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#faf6ef",
    theme_color: "#b4543f",
    icons: [
      {
        src: "/logo-amemais.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
