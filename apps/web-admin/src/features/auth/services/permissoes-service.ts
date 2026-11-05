import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

/** Módulos do painel, como a interface os enxerga (cada um aponta para um slug de `public.modulos`). */
export const MODULO_SLUG = {
  animais: "operacional",
  lares: "lares",
  eventos: "campanhas",
  urgencias: "urgencias",
  voluntarios: "voluntarios",
  doacoes: "doacoes",
  equipe: "admin",
} as const;

export type Modulo = keyof typeof MODULO_SLUG;
export type NivelAcesso = "total" | "leitura" | null;
export type PermissoesPorModulo = Record<Modulo, NivelAcesso>;

const MODULOS = Object.keys(MODULO_SLUG) as Modulo[];

export const permissoesService = {
  /**
   * Nível de acesso (`total`, `leitura` ou nenhum) da pessoa logada em cada módulo. Pergunta ao
   * próprio banco via `check_user_access` — a mesma função que o RLS usa — então a interface
   * nunca diverge do que o servidor de fato vai permitir.
   */
  async buscarMinhas(): Promise<PermissoesPorModulo> {
    const supabase = createSupabaseBrowserClient();

    const verificar = async (slug: string, nivelMinimo: "leitura" | "total") => {
      const { data, error } = await supabase.rpc("check_user_access", {
        modulo_slug: slug,
        nivel_minimo: nivelMinimo,
      });
      if (error) throw error;
      return data === true;
    };

    const niveis = await Promise.all(
      MODULOS.map(async (modulo): Promise<NivelAcesso> => {
        const slug = MODULO_SLUG[modulo];
        const [leitura, total] = await Promise.all([verificar(slug, "leitura"), verificar(slug, "total")]);
        return total ? "total" : leitura ? "leitura" : null;
      }),
    );

    return Object.fromEntries(MODULOS.map((modulo, i) => [modulo, niveis[i]])) as PermissoesPorModulo;
  },
};
