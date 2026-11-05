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

  async getOwnProfile(): Promise<Profile | null> {
    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email, telefone, foto_url, usuario_departamentos(departamentos(nome))")
      .eq("id", userData.user.id)
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
