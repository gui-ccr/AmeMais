import { ConflictError, InternalError } from "@/core/errors";
import { supabaseAdmin } from "@/lib/supabase";

/** Cerca de 100 anos: o "desativado" do Auth. `none` religa a conta. */
const BANIMENTO_PERMANENTE = "876000h";

/**
 * Operações na conta do Supabase Auth. É o ÚNICO ponto da feature que usa a service role, e
 * só deve ser chamado depois de o use case confirmar admin/total (via `IEquipeRepository`).
 *
 * `trocar_senha` fica em `app_metadata`, que o próprio usuário não consegue editar.
 * Nenhum método loga nem devolve a senha recebida.
 */
export interface IContasGateway {
  criarConta(dados: { nome: string; email: string; senha: string }): Promise<{ id: string }>;
  apagarConta(id: string): Promise<void>;
  definirAtivo(id: string, ativo: boolean): Promise<void>;
  definirSenhaProvisoria(id: string, senha: string): Promise<void>;
  trocarMinhaSenha(id: string, senha: string): Promise<void>;
}

export class ContasGateway implements IContasGateway {
  async criarConta({ nome, email, senha }: { nome: string; email: string; senha: string }): Promise<{ id: string }> {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
      app_metadata: { trocar_senha: true },
    });
    if (error || !data.user) {
      if (error?.code === "email_exists" || error?.code === "user_already_exists") {
        throw new ConflictError("Já existe uma conta com este e-mail");
      }
      throw new InternalError(error);
    }
    return { id: data.user.id };
  }

  /** Só para desfazer uma conta recém-criada cuja configuração falhou. Não é exposto como rota. */
  async apagarConta(id: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw new InternalError(error);
  }

  async definirAtivo(id: string, ativo: boolean): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: ativo ? "none" : BANIMENTO_PERMANENTE,
    });
    if (error) throw new InternalError(error);
  }

  async definirSenhaProvisoria(id: string, senha: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: senha,
      app_metadata: { trocar_senha: true },
    });
    if (error) throw new InternalError(error);
  }

  async trocarMinhaSenha(id: string, senha: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: senha,
      app_metadata: { trocar_senha: false },
    });
    if (error) throw new InternalError(error);
  }
}
