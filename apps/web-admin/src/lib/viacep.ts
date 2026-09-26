import { isValidCEP } from "./validations/cep";

export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

/** O CEP tem formato válido, mas o ViaCEP não o conhece. */
export class CepNaoEncontradoError extends Error {
  constructor() {
    super("CEP não encontrado");
    this.name = "CepNaoEncontradoError";
  }
}

/**
 * Consulta um CEP na API pública do ViaCEP.
 *
 * Usa `fetch` direto, de propósito, e NÃO a instância `api` de `@/lib/axios`:
 * aquela instância injeta o JWT do Supabase em toda requisição, e o token do
 * usuário nunca pode ir para um serviço de terceiros.
 */
export async function buscarCep(cep: string, signal?: AbortSignal): Promise<EnderecoViaCep> {
  const digitos = cep.replace(/\D/g, "");
  if (!isValidCEP(digitos)) {
    throw new Error("CEP inválido");
  }

  const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, { signal });
  if (!resposta.ok) {
    throw new Error(`Falha ao consultar o CEP (HTTP ${resposta.status})`);
  }

  const dados = (await resposta.json()) as Partial<EnderecoViaCep> & { erro?: boolean | string };
  if (dados.erro) {
    throw new CepNaoEncontradoError();
  }

  return {
    cep: dados.cep ?? "",
    logradouro: dados.logradouro ?? "",
    bairro: dados.bairro ?? "",
    localidade: dados.localidade ?? "",
    uf: dados.uf ?? "",
  };
}
