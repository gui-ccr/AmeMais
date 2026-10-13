import { z } from "zod";
import { UNIDADES_META } from "@/features/urgencias/types";
import { mensagemDeFotoInvalida } from "@/lib/foto";
import { isValidCPF } from "@/lib/validations/cpf";
import { isValidTelefone } from "@/lib/validations/telefone";
import { diaDeHoje } from "@/utils";
import { CATEGORIAS_DOACAO, type Doacao, type EditarDoacaoInput } from "./types";

export const VINCULOS = ["avulsa", "urgencia"] as const;
export type Vinculo = (typeof VINCULOS)[number];

const MENSAGEM_VINCULO = "Escolha entre doação avulsa ou vincular a uma urgência";
const MENSAGEM_CATEGORIA = "Selecione a categoria";

/** Campo opcional do doador: vazio vale; preenchido, precisa passar na validação. */
const opcional = (valido: (valor: string) => boolean, mensagem: string) =>
  z.string().refine((valor) => valor.trim() === "" || valido(valor), mensagem);

export const doacaoSchema = z
  .object({
    vinculo: z.enum(VINCULOS, { required_error: MENSAGEM_VINCULO, invalid_type_error: MENSAGEM_VINCULO }),
    urgenciaId: z.string(),
    descricao: z.string().trim().min(2, "Descreva o que foi doado"),
    quantidade: z.preprocess(
      (valor) => (valor === "" || valor === null || valor === undefined ? undefined : Number(valor)),
      z
        .number({ required_error: "Informe a quantidade", invalid_type_error: "Informe a quantidade" })
        .positive("A quantidade deve ser maior que zero"),
    ),
    unidade: z.enum(UNIDADES_META),
    categoria: z.enum(CATEGORIAS_DOACAO, { required_error: MENSAGEM_CATEGORIA, invalid_type_error: MENSAGEM_CATEGORIA }),
    localColeta: z.string().trim().min(2, "Informe onde a doação foi coletada"),
    // Uma mensagem só por vez: vazia, depois inválida, depois futura.
    dataEntrada: z.string().superRefine((valor, ctx) => {
      if (!valor) {
        ctx.addIssue({ code: "custom", message: "Informe a data de entrada" });
      } else if (Number.isNaN(Date.parse(valor))) {
        ctx.addIssue({ code: "custom", message: "A data informada é inválida" });
      } else if (valor > diaDeHoje()) {
        ctx.addIssue({ code: "custom", message: "A data de entrada não pode ser no futuro" });
      }
    }),
    // A foto é opcional: só confere tipo/tamanho quando há arquivo.
    foto: z.custom<File | null>().superRefine((arquivo, ctx) => {
      if (!(arquivo instanceof File)) return;

      const problema = mensagemDeFotoInvalida(arquivo);
      if (problema) ctx.addIssue({ code: "custom", message: problema });
    }),
    doadorNome: z.string(),
    doadorTelefone: opcional(isValidTelefone, "O telefone informado é inválido"),
    doadorCpf: opcional(isValidCPF, "O CPF informado é inválido"),
  })
  .superRefine((valores, ctx) => {
    if (valores.vinculo === "urgencia" && !valores.urgenciaId) {
      ctx.addIssue({ code: "custom", path: ["urgenciaId"], message: "Selecione a urgência" });
    }
  });

/** Valores do formulário (o que a pessoa digitou) e valores já validados. */
export type DoacaoFormEntrada = z.input<typeof doacaoSchema>;
export type DoacaoFormSaida = z.output<typeof doacaoSchema>;

export const DOACAO_FORM_VAZIO = {
  urgenciaId: "",
  descricao: "",
  quantidade: "",
  unidade: "kg",
  localColeta: "",
  foto: null,
  doadorNome: "",
  doadorTelefone: "",
  doadorCpf: "",
} satisfies Partial<DoacaoFormEntrada>;

/** Valores iniciais do formulário de edição, a partir da doação gravada. */
export function paraValoresDoFormulario(doacao: Doacao): DoacaoFormEntrada {
  return {
    vinculo: doacao.urgenciaId ? "urgencia" : "avulsa",
    urgenciaId: doacao.urgenciaId ?? "",
    descricao: doacao.descricao,
    quantidade: doacao.quantidade,
    unidade: doacao.unidade,
    categoria: doacao.categoria,
    localColeta: doacao.localColeta,
    dataEntrada: doacao.dataEntrada,
    foto: null,
    doadorNome: doacao.doadorNome ?? "",
    doadorTelefone: doacao.doadorTelefone ?? "",
    doadorCpf: doacao.doadorCpf ?? "",
  };
}

const vazioParaNull = (valor: string): string | null => valor.trim() || null;

/** Dos valores validados do formulário para o que o service recebe (sem foto e sem auditoria). */
export function paraDadosDaDoacao(valores: DoacaoFormSaida): Omit<EditarDoacaoInput, "foto"> {
  return {
    descricao: valores.descricao,
    quantidade: valores.quantidade,
    unidade: valores.unidade,
    categoria: valores.categoria,
    localColeta: valores.localColeta,
    dataEntrada: valores.dataEntrada,
    urgenciaId: valores.vinculo === "urgencia" ? valores.urgenciaId : null,
    doadorNome: vazioParaNull(valores.doadorNome),
    doadorTelefone: vazioParaNull(valores.doadorTelefone),
    doadorCpf: vazioParaNull(valores.doadorCpf),
  };
}
