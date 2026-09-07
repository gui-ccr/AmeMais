import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002").replace(/\/$/, "");

export const SITE_NAME = "AmeMais";

export const SITE_DESCRIPTION =
  "ONG de proteção animal que resgata, cuida e encontra famílias para cães e gatos abandonados em Teófilo Otoni, MG. Adote, doe via PIX ou seja um lar temporário.";

export const SITE_LOCALE = "pt_BR";

export const SOCIAL = {
  instagram: "https://instagram.com/amemais.to",
  instagramHandle: "@amemais.to",
  email: "contato@amemais.org.br",
};

/**
 * Next.js does not deep-merge `openGraph`/`twitter` between a layout and a
 * page — a page that sets either field replaces the parent's object
 * entirely. This builds a complete, page-correct Metadata object (title,
 * description, canonical, and per-page og:url) in one place instead of
 * repeating openGraph/twitter boilerplate on every page.
 */
export function buildPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const fullTitle = `${title} — ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      siteName: SITE_NAME,
      url: path,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}
