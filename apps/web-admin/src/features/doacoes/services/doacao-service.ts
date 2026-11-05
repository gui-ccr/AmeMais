import { api } from "@/lib/axios";
import type { Doacao, EditarDoacaoInput, NovaDoacaoInput } from "../types";

/**
 * Chamadas à API real (`/api/doacoes`). O formato da resposta é o `DoacaoDTO` da API
 * (apps/api/src/features/doacoes/doacao.dto.ts), idêntico ao tipo `Doacao` das telas.
 *
 * - `registradoPor` e `createdAt` são definidos pelo servidor (usuário autenticado).
 * - Vincular a uma urgência é só uma referência: não soma nada no progresso dela.
 * - A foto sobe antes, em `POST /api/uploads/imagem` (tipo "doacao"), e a URL
 *   devolvida segue em `urlFoto`.
 */

/** Dados da doação como a API espera (sem o arquivo da foto). */
type DadosDaApi = Omit<NovaDoacaoInput, "foto">;

async function enviarFoto(foto: File): Promise<string> {
  const form = new FormData();
  form.append("file", foto);
  form.append("tipo", "doacao");

  const { data } = await api.post<{ data: { url: string } }>("/api/uploads/imagem", form);
  return data.data.url;
}

export const doacaoService = {
  /** A API já devolve ordenado: mais recentes primeiro. */
  async list(): Promise<Doacao[]> {
    const { data } = await api.get<{ data: Doacao[] }>("/api/doacoes");
    return data.data;
  },

  async create(input: NovaDoacaoInput): Promise<Doacao> {
    const { foto, ...dados } = input;
    const urlFoto = foto ? await enviarFoto(foto) : null;

    const payload: DadosDaApi & { urlFoto: string | null } = { ...dados, urlFoto };
    const { data } = await api.post<{ data: Doacao }>("/api/doacoes", payload);
    return data.data;
  },

  /** Foto: `undefined` mantém a atual (não é enviada), um arquivo troca, `null` remove. */
  async update(id: string, input: EditarDoacaoInput): Promise<Doacao> {
    const { foto, ...dados } = input;
    const alteracaoDeFoto = foto === undefined ? {} : { urlFoto: foto === null ? null : await enviarFoto(foto) };

    const { data } = await api.put<{ data: Doacao }>(`/api/doacoes/${id}`, { ...dados, ...alteracaoDeFoto });
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/doacoes/${id}`);
  },
};
