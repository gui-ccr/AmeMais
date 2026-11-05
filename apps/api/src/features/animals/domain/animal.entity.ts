import { ValidationError } from "@/core/errors";
import { Adotante, type AdotanteInput } from "./adotante.vo";
import {
  DESCRICAO_MAX,
  ESPECIES,
  FAIXA_ETARIA_PADRAO,
  FAIXAS_ETARIAS,
  IDADE_TEXTO_MAX,
  PORTE_PADRAO,
  PORTES,
  type FaixaEtaria,
  type Porte,
} from "./animal-options";
import { AnimalStatus, type AnimalStatusValue } from "./animal-status.vo";

/** Fuso em que a ONG opera: define o que é "hoje" para a data de adoção. */
const FUSO_DA_ONG = "America/Sao_Paulo";

/** Dia de hoje ("AAAA-MM-DD") no fuso da ONG. `en-CA` já formata nesse padrão. */
function hojeNoFusoDaOng(agora: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_DA_ONG }).format(agora);
}

/** Dia que existe no calendário (rejeita 2026-02-30) e não é futuro: ninguém adota amanhã. */
function validarDataAdocao(valor: string): string {
  const existe =
    /^\d{4}-\d{2}-\d{2}$/.test(valor) && new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) === valor;
  if (!existe) {
    throw new ValidationError("dataAdocao deve ser uma data válida no formato AAAA-MM-DD");
  }
  if (valor > hojeNoFusoDaOng(new Date())) {
    throw new ValidationError("dataAdocao não pode ser uma data futura");
  }
  return valor;
}

/** Texto livre opcional: tira os espaços das pontas, vazio vira null e respeita o limite do banco. */
function normalizarTextoOpcional(valor: string | null | undefined, campo: string, maximo: number): string | null {
  const texto = valor?.trim();
  if (!texto) return null;
  if (texto.length > maximo) {
    throw new ValidationError(`${campo} deve ter no máximo ${maximo} caracteres`);
  }
  return texto;
}

function validarPorte(valor: string): Porte {
  if (!(PORTES as readonly string[]).includes(valor)) {
    throw new ValidationError(`porte deve ser um de: ${PORTES.join(", ")}`);
  }
  return valor as Porte;
}

function validarFaixaEtaria(valor: string): FaixaEtaria {
  if (!(FAIXAS_ETARIAS as readonly string[]).includes(valor)) {
    throw new ValidationError(`faixaEtaria deve ser uma de: ${FAIXAS_ETARIAS.join(", ")}`);
  }
  return valor as FaixaEtaria;
}

/** Estado de um animal já salvo no banco. */
export interface AnimalProps {
  id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  status: AnimalStatus;
  /** Porte e faixa etária aparecem no site público. */
  porte: Porte;
  faixaEtaria: FaixaEtaria;
  idadeTexto: string | null;
  descricao: string | null;
  urlFoto: string | null;
  larTemporarioId: string | null;
  /** Usuário do sistema que adotou (fluxo antigo). O cadastro pelo admin usa `adotante`. */
  adotanteId: string | null;
  /** Quem adotou, quando o cadastro trouxe os dados da adoção. Só existe com status `adotado`. */
  adotante: Adotante | null;
  dataAdocao: string | null;
  createdAt: string;
}

/** Dados de entrada para cadastrar um animal novo, ainda sem id/createdAt. */
export interface NewAnimalProps {
  nome: string;
  especie?: string | null;
  raca?: string | null;
  status?: AnimalStatusValue;
  /** Sem porte/faixa, assume M/adulto (o mesmo padrão do banco). */
  porte?: string;
  faixaEtaria?: string;
  idadeTexto?: string | null;
  descricao?: string | null;
  urlFoto?: string | null;
  adotante?: AdotanteInput | null;
  dataAdocao?: string | null;
}

/** Dados editáveis de um animal já cadastrado (não inclui status, foto nem adoção). */
export interface AnimalDadosInput {
  nome: string;
  especie: string;
  raca: string;
  porte: string;
  faixaEtaria: string;
  idadeTexto?: string | null;
  descricao?: string | null;
}

/** Dados da adoção, exigidos para mudar o status de um animal para `adotado`. */
export interface AdocaoInput {
  adotante?: AdotanteInput;
  dataAdocao?: string;
}

/** Dados já validados e normalizados por `Animal.create()`, prontos para persistir. */
export type AnimalCreationData = Omit<AnimalProps, "id" | "createdAt">;

/** Entidade Animal: guarda as regras para nunca ficar num estado inválido. */
export class Animal {
  /** Status com os quais um animal pode nascer no sistema — ver create(). */
  private static readonly STATUSES_PERMITIDOS_NA_CRIACAO: readonly AnimalStatusValue[] = [
    "disponivel",
    "em_tratamento",
    "adotado",
  ];

  private constructor(private props: AnimalProps) {}

  /** Reconstrói a entidade a partir de dados já persistidos (chamado só pelo mapper, ao ler uma linha do banco). */
  static restore(props: AnimalProps): Animal {
    return new Animal(props);
  }

  /** Valida as regras de negócio de cadastro e devolve os dados prontos para persistir. */
  static create(input: NewAnimalProps): AnimalCreationData {
    const nome = input.nome?.trim();
    if (!nome || nome.length < 2) {
      throw new ValidationError("nome deve ter pelo menos 2 caracteres");
    }

    if (input.especie != null && !(ESPECIES as readonly string[]).includes(input.especie)) {
      throw new ValidationError(`especie deve ser uma de: ${ESPECIES.join(", ")}`);
    }

    const statusValue = input.status ?? "disponivel";
    if (!Animal.STATUSES_PERMITIDOS_NA_CRIACAO.includes(statusValue)) {
      throw new ValidationError(
        `Um animal não pode ser cadastrado diretamente com o status "${statusValue}" — ` +
          `o cadastro só aceita "${Animal.STATUSES_PERMITIDOS_NA_CRIACAO.join('", "')}"`,
      );
    }

    let adotante: Adotante | null = null;
    let dataAdocao: string | null = null;

    if (statusValue === "adotado") {
      if (!input.especie?.trim()) {
        throw new ValidationError("especie é obrigatória para cadastrar um animal já adotado");
      }
      if (!input.raca?.trim()) {
        throw new ValidationError("raca é obrigatória para cadastrar um animal já adotado");
      }
      if (!input.adotante) {
        throw new ValidationError("adotante é obrigatório para um animal adotado");
      }
      if (!input.dataAdocao) {
        throw new ValidationError("dataAdocao é obrigatória para um animal adotado");
      }
      adotante = Adotante.from(input.adotante);
      dataAdocao = validarDataAdocao(input.dataAdocao);
    } else if (input.adotante || input.dataAdocao) {
      throw new ValidationError('adotante e dataAdocao só podem ser informados para um animal com status "adotado"');
    }

    return {
      nome,
      especie: input.especie ?? null,
      raca: input.raca?.trim() || null,
      status: AnimalStatus.from(statusValue),
      porte: validarPorte(input.porte ?? PORTE_PADRAO),
      faixaEtaria: validarFaixaEtaria(input.faixaEtaria ?? FAIXA_ETARIA_PADRAO),
      idadeTexto: normalizarTextoOpcional(input.idadeTexto, "idadeTexto", IDADE_TEXTO_MAX),
      descricao: normalizarTextoOpcional(input.descricao, "descricao", DESCRICAO_MAX),
      urlFoto: input.urlFoto ?? null,
      larTemporarioId: null,
      adotanteId: null,
      adotante,
      dataAdocao,
    };
  }

  get id(): string {
    return this.props.id;
  }
  get nome(): string {
    return this.props.nome;
  }
  get especie(): string | null {
    return this.props.especie;
  }
  get raca(): string | null {
    return this.props.raca;
  }
  get porte(): Porte {
    return this.props.porte;
  }
  get faixaEtaria(): FaixaEtaria {
    return this.props.faixaEtaria;
  }
  get idadeTexto(): string | null {
    return this.props.idadeTexto;
  }
  get descricao(): string | null {
    return this.props.descricao;
  }
  get status(): AnimalStatus {
    return this.props.status;
  }
  get urlFoto(): string | null {
    return this.props.urlFoto;
  }
  get larTemporarioId(): string | null {
    return this.props.larTemporarioId;
  }
  get adotanteId(): string | null {
    return this.props.adotanteId;
  }
  get adotante(): Adotante | null {
    return this.props.adotante;
  }
  get dataAdocao(): string | null {
    return this.props.dataAdocao;
  }
  get createdAt(): string {
    return this.props.createdAt;
  }

  /** Edita os dados do animal (mesmas regras do cadastro). O status e a adoção não mudam aqui. */
  update(input: AnimalDadosInput): void {
    const nome = input.nome?.trim();
    if (!nome || nome.length < 2) {
      throw new ValidationError("nome deve ter pelo menos 2 caracteres");
    }
    if (!(ESPECIES as readonly string[]).includes(input.especie)) {
      throw new ValidationError(`especie deve ser uma de: ${ESPECIES.join(", ")}`);
    }
    const raca = input.raca?.trim();
    if (!raca) {
      throw new ValidationError("raca é obrigatória");
    }

    this.props.nome = nome;
    this.props.especie = input.especie;
    this.props.raca = raca;
    this.props.porte = validarPorte(input.porte);
    this.props.faixaEtaria = validarFaixaEtaria(input.faixaEtaria);
    this.props.idadeTexto = normalizarTextoOpcional(input.idadeTexto, "idadeTexto", IDADE_TEXTO_MAX);
    this.props.descricao = normalizarTextoOpcional(input.descricao, "descricao", DESCRICAO_MAX);
  }

  /** Único jeito de mudar o status de um animal. */
  changeStatus(novoStatus: AnimalStatus, adocao?: AdocaoInput): void {
    if (!this.props.status.podeTransicionarPara(novoStatus)) {
      throw new ValidationError(
        `Não é possível mudar o status de "${this.props.status}" para "${novoStatus}"`,
      );
    }

    // Lar temporário sem lar é um estado inconsistente: quem coloca o animal num lar
    // é o vínculo (POST /api/lares/:id/animais), que grava o lar e o status juntos.
    if (novoStatus.valor === "em_lar_temporario" && !this.props.larTemporarioId) {
      throw new ValidationError(
        'Para marcar o animal como "Lar temporário", escolha o lar onde ele ficará (vincule o animal a um lar)',
      );
    }

    if (novoStatus.valor === "adotado") {
      if (!adocao?.adotante) {
        throw new ValidationError("adotante é obrigatório para marcar o animal como adotado");
      }
      if (!adocao.dataAdocao) {
        throw new ValidationError("dataAdocao é obrigatória para marcar o animal como adotado");
      }
      const adotante = Adotante.from(adocao.adotante);
      const dataAdocao = validarDataAdocao(adocao.dataAdocao);

      this.props.status = novoStatus;
      this.props.larTemporarioId = null;
      this.props.adotante = adotante;
      this.props.adotanteId = null;
      this.props.dataAdocao = dataAdocao;
      return;
    }

    if (adocao) {
      throw new ValidationError('adotante e dataAdocao só podem ser informados ao mudar para o status "adotado"');
    }

    this.props.status = novoStatus;
    // Só `em_lar_temporario` mantém o lar; qualquer outro status libera a vaga.
    if (novoStatus.valor !== "em_lar_temporario") this.props.larTemporarioId = null;
    this.props.adotante = null;
    this.props.adotanteId = null;
    this.props.dataAdocao = null;
  }
}
