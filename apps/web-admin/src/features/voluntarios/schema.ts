import { z } from "zod";
import { isValidTelefone } from "@/lib/validations/telefone";
import { formatPhone } from "@/utils";
import { AREAS_DE_AJUDA, TIPOS_VOLUNTARIO, type NovoVoluntarioInput, type Voluntario } from "./types";

const MENSAGEM_TIPO = "Selecione o tipo de voluntário";

/** Formulário de voluntário (cadastro e edição). */
export const voluntarioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do voluntário (mínimo 2 letras)"),
  email: z
    .string()
    .trim()
    .refine((valor) => valor === "" || z.string().email().safeParse(valor).success, "O e-mail informado é inválido"),
  // Uma mensagem só por vez: vazio, depois inválido.
  telefone: z
    .string()
    .trim()
    .superRefine((valor, ctx) => {
      if (!valor) ctx.addIssue({ code: "custom", message: "Informe o telefone ou WhatsApp" });
      else if (!isValidTelefone(valor)) ctx.addIssue({ code: "custom", message: "O telefone informado é inválido" });
    }),
  tipo: z.enum(TIPOS_VOLUNTARIO, { required_error: MENSAGEM_TIPO, invalid_type_error: MENSAGEM_TIPO }),
  bairro: z.string().trim(),
  areasDeAjuda: z.array(z.enum(AREAS_DE_AJUDA)),
});

/** Valores do formulário (o que a pessoa digitou) e valores já validados. */
export type VoluntarioFormEntrada = z.input<typeof voluntarioSchema>;
export type VoluntarioFormSaida = z.output<typeof voluntarioSchema>;

/** Sem `tipo`: o Select começa vazio para obrigar a escolha. */
export const VOLUNTARIO_FORM_VAZIO = {
  nome: "",
  email: "",
  telefone: "",
  bairro: "",
  areasDeAjuda: [],
} satisfies Partial<VoluntarioFormEntrada>;

/** Valores iniciais do formulário de edição, a partir do voluntário gravado. */
export function paraValoresDoFormulario(voluntario: Voluntario): VoluntarioFormEntrada {
  return {
    nome: voluntario.nome,
    email: voluntario.email,
    telefone: voluntario.telefone,
    tipo: voluntario.tipo,
    bairro: voluntario.bairro,
    areasDeAjuda: [...voluntario.areasDeAjuda],
  };
}

const vazioParaNull = (valor: string): string | null => valor.trim() || null;

/**
 * Dos valores validados para o que o service recebe. O telefone sai sempre com a
 * máscara (mesmo que tenha sido colado só com números) e as áreas sem repetição,
 * na ordem de `AREAS_DE_AJUDA`.
 */
export function paraDadosDoVoluntario(valores: VoluntarioFormSaida): NovoVoluntarioInput {
  return {
    nome: valores.nome,
    email: vazioParaNull(valores.email),
    telefone: formatPhone(valores.telefone),
    tipo: valores.tipo,
    bairro: vazioParaNull(valores.bairro),
    areasDeAjuda: AREAS_DE_AJUDA.filter((area) => valores.areasDeAjuda.includes(area)),
  };
}
