import { revalidateTag } from "next/cache";
import { handleRevalidateRequest } from "@/lib/revalidate-request";

/**
 * Chamada pela `apps/api` quando animais, urgências ou pontos de coleta mudam,
 * para o site mostrar a mudança na hora e não só depois do prazo do cache.
 * Protegida por segredo compartilhado (`REVALIDATE_SECRET`). Ver ADR 0009.
 */
export async function POST(request: Request) {
  return handleRevalidateRequest(request, {
    secret: process.env.REVALIDATE_SECRET,
    revalidateTag,
  });
}
