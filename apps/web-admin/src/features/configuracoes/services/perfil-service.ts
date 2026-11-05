import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const BUCKET = "avatars";

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface AtualizarPerfilInput {
  userId: string;
  nome: string;
  telefone: string;
  /** Foto nova a enviar. */
  foto?: File | null;
  /** URL da foto atual; `null` remove a foto. Ignorada quando `foto` é enviada. */
  fotoUrlAtual: string | null;
}

export const perfilService = {
  /** Envia a foto (na pasta do próprio usuário, exigida pela policy do bucket) e devolve a URL pública. */
  async enviarFoto(userId: string, foto: File): Promise<string> {
    const supabase = createSupabaseBrowserClient();
    const extensao = EXTENSAO_POR_TIPO[foto.type] ?? "jpg";
    // Nome novo a cada envio: evita cache do navegador/CDN servir a foto antiga.
    const path = `${userId}/${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, foto, { contentType: foto.type });
    if (error) throw error;

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async atualizar({ userId, nome, telefone, foto, fotoUrlAtual }: AtualizarPerfilInput): Promise<void> {
    const supabase = createSupabaseBrowserClient();
    const fotoUrl = foto ? await perfilService.enviarFoto(userId, foto) : fotoUrlAtual;

    const { error } = await supabase.rpc("atualizar_meu_perfil", {
      p_nome: nome,
      p_telefone: telefone,
      p_foto_url: fotoUrl,
    });
    if (error) throw error;
  },
};
