import { isAxiosError } from "axios";

/**
 * Texto para mostrar ao usuário quando uma chamada à API falha. A API responde
 * `{ "error": "mensagem" }` (ver apps/api/src/core/http.ts); sem resposta,
 * o problema é de conexão. Qualquer outro caso cai na `mensagemPadrao`.
 */
export function mensagemDeErroDaApi(error: unknown, mensagemPadrao: string): string {
  if (isAxiosError(error)) {
    if (!error.response) return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

    const mensagemDaApi = error.response.data?.error;
    if (typeof mensagemDaApi === "string") return mensagemDaApi;
  }
  return mensagemPadrao;
}
