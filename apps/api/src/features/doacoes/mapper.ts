import { Doacao, type CategoriaDoacao, type UnidadeDoacao } from "./domain/doacao.entity";
import type { CreateDoacaoDTO, UpdateDoacaoDTO } from "./schema";

/** Formato exato da tabela "doacoes" no Postgres (snake_case). */
export interface DoacaoRow {
  id: string;
  descricao: string;
  quantidade: number | string;
  unidade: string;
  categoria: string;
  local_coleta: string;
  data_entrada: string;
  foto_url: string | null;
  urgencia_id: string | null;
  nome_doador: string | null;
  telefone_doador: string | null;
  cpf_doador: string | null;
  registrado_por_nome: string;
  created_at: string;
}

export function mapRowToEntity(row: DoacaoRow): Doacao {
  return Doacao.restore({
    id: row.id,
    descricao: row.descricao,
    // `numeric` do Postgres pode chegar como string.
    quantidade: Number(row.quantidade),
    unidade: row.unidade as UnidadeDoacao,
    categoria: row.categoria as CategoriaDoacao,
    localColeta: row.local_coleta,
    dataEntrada: row.data_entrada,
    urlFoto: row.foto_url,
    urgenciaId: row.urgencia_id,
    doadorNome: row.nome_doador,
    doadorTelefone: row.telefone_doador,
    doadorCpf: row.cpf_doador,
    registradoPor: row.registrado_por_nome,
    createdAt: row.created_at,
  });
}

/** `registrado_por_*` e `created_at` ficam de fora: quem define é a trigger do banco. */
export function mapCreateDTOToRow(input: CreateDoacaoDTO) {
  return {
    descricao: input.descricao,
    quantidade: input.quantidade,
    unidade: input.unidade,
    categoria: input.categoria,
    local_coleta: input.localColeta,
    data_entrada: input.dataEntrada,
    foto_url: input.urlFoto,
    urgencia_id: input.urgenciaId,
    nome_doador: input.doadorNome,
    telefone_doador: input.doadorTelefone,
    cpf_doador: input.doadorCpf,
  };
}

export function mapUpdateDTOToRow(input: UpdateDoacaoDTO) {
  const row: Record<string, unknown> = {};
  if (input.descricao !== undefined) row.descricao = input.descricao;
  if (input.quantidade !== undefined) row.quantidade = input.quantidade;
  if (input.unidade !== undefined) row.unidade = input.unidade;
  if (input.categoria !== undefined) row.categoria = input.categoria;
  if (input.localColeta !== undefined) row.local_coleta = input.localColeta;
  if (input.dataEntrada !== undefined) row.data_entrada = input.dataEntrada;
  if (input.urlFoto !== undefined) row.foto_url = input.urlFoto;
  if (input.urgenciaId !== undefined) row.urgencia_id = input.urgenciaId;
  if (input.doadorNome !== undefined) row.nome_doador = input.doadorNome;
  if (input.doadorTelefone !== undefined) row.telefone_doador = input.doadorTelefone;
  if (input.doadorCpf !== undefined) row.cpf_doador = input.doadorCpf;
  return row;
}
