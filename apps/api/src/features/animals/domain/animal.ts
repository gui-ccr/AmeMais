/**
 * Lista readonly de todos os status possíveis para um animal no sistema da ONG.
 * Usamos 'as const' para que o TypeScript trate cada string como um valor literal único.
 */
export const ANIMAL_STATUSES = [
  "disponivel",
  "em_tratamento",
  "em_lar_temporario",
  "adotado",
] as const;

/**
 * Tipo derivado dos status válidos.
 * 
 * --- POR QUE USAR STRING UNION TYPE EM VEZ DE TS ENUMS? ---
 * 
 * 1. Sem overhead de execução: Union Types de string desaparecem completamente após a transpilação. 
 *    Enums geram código IIFE e objetos adicionais no JavaScript gerado.
 * 2. Integração simplificada: O banco de dados (Supabase/PostgreSQL) armazena status como texto/enum. 
 *    Mapear diretamente para strings literais reduz a necessidade de mapeadores (mappings) complexos na API.
 * 3. Compatibilidade nativa com Zod: Para validar payloads de entrada com Zod, podemos usar diretamente 
 *    `z.enum(ANIMAL_STATUSES)`, garantindo sincronia perfeita entre validação em runtime e tipagem estática.
 */
export type AnimalStatus = typeof ANIMAL_STATUSES[number];

/**
 * Tabela de transições de status permitidas pela ONG.
 * Chave: Status Atual -> Valor: Array de status de destino válidos.
 */
const ALLOWED_TRANSITIONS: Record<AnimalStatus, readonly AnimalStatus[]> = {
  em_tratamento: [
    "disponivel",        // Recuperado, curado e pronto para ir para um lar definitivo.
    "em_lar_temporario", // Casos de tratamento longo ou recuperação que se beneficia de um ambiente familiar.
  ],
  disponivel: [
    "em_tratamento",     // Caso o animal adoeça, se machuque ou precise de cuidados veterinários urgentes.
    "em_lar_temporario", // Enviado para lar temporário (ex: liberar espaço no abrigo ou socialização).
    "adotado",           // Adoção concluída com sucesso.
  ],
  em_lar_temporario: [
    "disponivel",        // Retorna ao fluxo geral de adoção (ex: fim do período de acolhimento temporário).
    "em_tratamento",     // Retorna ao abrigo para cuidados clínicos se adoecer gravemente.
    "adotado",           // Adotado pelo próprio lar temporário ("foster fail") ou por outra família.
  ],
  adotado: [
    "disponivel",        // Casos infelizes de devolução do animal. Ele volta a ficar disponível para adoção.
    "em_tratamento",     // Caso o animal seja devolvido doente, machucado ou precisando de reabilitação.
  ],
};

/**
 * Função pura que determina se uma transição de status de um animal é válida de acordo com as regras de negócio.
 * 
 * --- REGRAS DE TRANSIÇÃO E JUSTIFICATIVAS ---
 * 
 * 1. Não transicionar para o mesmo status: Se `statusAtual === novoStatus`, a função retorna `false`. 
 *    Evita desperdício de escrita em banco e logs redundantes de histórico.
 * 
 * 2. Bloqueio de 'em_tratamento' ➔ 'adotado': Animais sob tratamento médico ativo no abrigo não devem 
 *    ser adotados diretamente. Devem passar para 'disponivel' primeiro (liberação veterinária) ou 'em_lar_temporario' 
 *    (se a adoção for assistida e a pessoa atuar como lar temporário ciente). Isso protege a saúde do animal 
 *    e evita repassar responsabilidades clínicas não acordadas para novos adotantes.
 * 
 * 3. Bloqueio de 'adotado' ➔ 'em_lar_temporario': Se um animal adotado for devolvido ou resgatado, ele deve 
 *    obrigatoriamente voltar para a triagem do abrigo (seja como 'disponivel' ou 'em_tratamento'). Ele não pode ir 
 *    direto para um novo lar temporário sem reavaliação física e comportamental prévia.
 * 
 * 4. Flexibilidade de 'em_lar_temporario' ➔ 'adotado': O lar temporário tem prioridade de adoção ("foster fail")
 *    ou pode intermediar a entrega direta, permitindo a adoção a partir desse estado sem a necessidade de o 
 *    animal retornar fisicamente ao abrigo apenas para mudar de status.
 * 
 * @param statusAtual Status atual do animal no sistema.
 * @param novoStatus Status para o qual se deseja alterar.
 * @returns true se a transição for permitida pelas regras de negócio da ONG, caso contrário false.
 */
export function podeAlterarStatus(
  statusAtual: AnimalStatus,
  novoStatus: AnimalStatus
): boolean {
  if (statusAtual === novoStatus) {
    return false;
  }

  const destinosPermitidos = ALLOWED_TRANSITIONS[statusAtual];
  return destinosPermitidos.includes(novoStatus);
}
