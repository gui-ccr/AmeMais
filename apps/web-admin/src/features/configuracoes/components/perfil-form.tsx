"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@amemais/shared-types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FotoDropzone } from "@/components/ui/foto-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MensagemErro } from "@/components/ui/mensagem-erro";
import { useToast } from "@/components/ui/toast";
import { AvatarUsuario } from "@/features/auth/components/avatar-usuario";
import { mensagemDeFotoInvalida } from "@/lib/foto";
import { perfilSchema, type PerfilFormValues } from "../schema";
import { perfilService } from "../services/perfil-service";

export function PerfilForm({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoUrlAtual, setFotoUrlAtual] = useState<string | null>(profile.fotoUrl);
  const [erroFoto, setErroFoto] = useState<string | undefined>();
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nome: profile.nome, telefone: profile.telefone ?? "" },
  });

  function escolherFoto(arquivo: File | null) {
    const mensagem = arquivo ? mensagemDeFotoInvalida(arquivo) : null;
    setErroFoto(mensagem ?? undefined);
    setFoto(mensagem ? null : arquivo);
  }

  async function salvar(valores: PerfilFormValues) {
    setErro(null);
    try {
      await perfilService.atualizar({
        userId: profile.id,
        nome: valores.nome,
        telefone: valores.telefone ?? "",
        foto,
        fotoUrlAtual,
      });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setFoto(null);
      toast({ tipo: "sucesso", titulo: "Perfil atualizado!" });
    } catch {
      setErro("Não foi possível salvar suas informações. Tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit(salvar)} className="flex max-w-xl flex-col gap-6" noValidate>
      <div className="flex items-center gap-4">
        <AvatarUsuario nome={profile.nome || profile.email} fotoUrl={profile.fotoUrl} className="h-20 w-20 text-3xl" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-semibold text-foreground">{profile.nome || profile.email}</span>
          <span className="truncate text-sm text-muted-foreground">{profile.departamentos.join(", ")}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="foto-perfil">Foto</Label>
        <FotoDropzone
          id="foto-perfil"
          value={foto}
          onChange={escolherFoto}
          hasError={!!erroFoto}
          urlAtual={fotoUrlAtual}
          onRemoverAtual={() => setFotoUrlAtual(null)}
        />
        <MensagemErro id="foto-perfil-erro" mensagem={erroFoto} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="nome" required>Nome</Label>
        <Input id="nome" autoComplete="name" hasError={!!errors.nome} aria-describedby="nome-erro" {...register("nome")} />
        <MensagemErro id="nome-erro" mensagem={errors.nome?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          type="tel"
          autoComplete="tel"
          placeholder="(11) 91234-5678"
          hasError={!!errors.telefone}
          aria-describedby="telefone-erro"
          {...register("telefone")}
        />
        <MensagemErro id="telefone-erro" mensagem={errors.telefone?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" value={profile.email} readOnly disabled aria-describedby="email-ajuda" />
        <p id="email-ajuda" className="text-xs text-muted-foreground">
          O e-mail é o seu login e não pode ser alterado aqui.
        </p>
      </div>

      {erro && <p role="alert" className="text-sm font-medium text-destructive">{erro}</p>}

      <div>
        <Button type="submit" disabled={isSubmitting || !!erroFoto}>
          {isSubmitting ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
