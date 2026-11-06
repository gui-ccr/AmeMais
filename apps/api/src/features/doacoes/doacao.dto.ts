import type { Doacao } from "./domain/doacao.entity";

/**
 * DTO de saída: o formato exato que a API devolve (e que o web-admin espelha em
 * features/doacoes/types.ts). `registradoPor` é o NOME de quem cadastrou, gravado
 * pelo banco a partir do usuário autenticado — o cliente não consegue informá-lo.
 */
export interface DoacaoDTO {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  categoria: string;
  localColeta: string;
  dataEntrada: string;
  urlFoto: string | null;
  urgenciaId: string | null;
  doadorNome: string | null;
  doadorTelefone: string | null;
  doadorCpf: string | null;
  registradoPor: string;
  createdAt: string;
}

export function toDoacaoDTO(doacao: Doacao): DoacaoDTO {
  return {
    id: doacao.id,
    descricao: doacao.descricao,
    quantidade: doacao.quantidade,
    unidade: doacao.unidade,
    categoria: doacao.categoria,
    localColeta: doacao.localColeta,
    dataEntrada: doacao.dataEntrada,
    urlFoto: doacao.urlFoto,
    urgenciaId: doacao.urgenciaId,
    doadorNome: doacao.doadorNome,
    doadorTelefone: doacao.doadorTelefone,
    doadorCpf: doacao.doadorCpf,
    registradoPor: doacao.registradoPor,
    createdAt: doacao.createdAt,
  };
}
