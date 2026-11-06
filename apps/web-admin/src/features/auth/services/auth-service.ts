import type { Profile } from "@amemais/shared-types";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export const authService = {
  async signIn(email: string, password: string) {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  },

  async signOut() {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async resetPasswordForEmail(email: string) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/trocar-senha`,
    });
    if (error) throw error;
  },

  async updatePassword(password: string) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  /** Renova o token para refletir mudanças feitas no servidor (ex.: marca `trocar_senha` limpa). */
  async refreshSession() {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.refreshSession();
    if (error) throw error;
  },

  async getOwnProfile(): Promise<Profile | null> {
    const supabase = createSupabaseBrowserClient();
    // getSession lê do storage local; getUser faria uma ida à rede a cada chamada (o RLS já valida o token).
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return null;

    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email, telefone, foto_url, usuario_departamentos(departamentos(nome))")
      .eq("id", userId)
      .single();

    if (error || !data) return null;

    const { usuario_departamentos, foto_url, ...profile } = data as unknown as {
      id: string;
      nome: string;
      email: string;
      telefone: string | null;
      foto_url: string | null;
      usuario_departamentos: { departamentos: { nome: string } | null }[];
    };

    return {
      ...profile,
      fotoUrl: foto_url,
      departamentos: usuario_departamentos
        .map((ud) => ud.departamentos?.nome)
        .filter((nome): nome is string => !!nome),
    };
  },
};
