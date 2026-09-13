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

  async getOwnProfile(): Promise<Profile | null> {
    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email, usuario_departamentos(departamentos(nome))")
      .eq("id", userData.user.id)
      .single();

    if (error || !data) return null;

    const { usuario_departamentos, ...profile } = data as {
      id: string;
      nome: string;
      email: string;
      usuario_departamentos: { departamentos: { nome: string }[] }[];
    };

    return {
      ...profile,
      departamentos: usuario_departamentos.flatMap((ud) => ud.departamentos.map((d) => d.nome)),
    };
  },
};
