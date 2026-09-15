"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "../services/auth-service";

export function RecuperarSenhaForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await authService.resetPasswordForEmail(email);
    } finally {
      // Sempre mostra a mesma mensagem, exista ou não o e-mail, para não
      // revelar quais e-mails estão cadastrados no sistema.
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-2 text-center">
        <p className="text-sm text-foreground">
          Se o e-mail informado estiver cadastrado, enviamos um link para redefinir a senha.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" required>
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          required
          placeholder="seu-email@exemplo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full mt-2">
        {loading ? "Enviando..." : "Enviar link de recuperação"}
      </Button>
    </form>
  );
}
