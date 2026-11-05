"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { equipeService } from "@/features/equipe/services/equipe-service";
import { MIN_PASSWORD_SCORE } from "@/lib/password-strength";
import { authService } from "../services/auth-service";
import { PasswordStrengthMeter, usePasswordStrength } from "./password-strength-meter";

export function TrocarSenhaForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordStrength = usePasswordStrength(password);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (passwordStrength && passwordStrength.score < MIN_PASSWORD_SCORE) {
      setError("Escolha uma senha mais forte");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const session = await authService.getSession();
      if (session?.user.app_metadata?.trocar_senha === true) {
        // Senha provisória: só a API limpa a marca `trocar_senha` junto com a troca.
        await equipeService.trocarMinhaSenha(password);
        await authService.refreshSession();
      } else {
        await authService.updatePassword(password);
      }
      router.push("/admin");
    } catch {
      setError("Não foi possível trocar a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" required>
          Nova senha
        </Label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          placeholder="••••••••"
          value={password}
          hasError={!!error}
          onChange={(event) => setPassword(event.target.value)}
        />
        <PasswordStrengthMeter password={password} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword" required>
          Confirmar nova senha
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          minLength={6}
          placeholder="••••••••"
          value={confirmPassword}
          hasError={!!error}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      <Button
        type="submit"
        disabled={loading || (!!passwordStrength && passwordStrength.score < MIN_PASSWORD_SCORE)}
        className="w-full mt-2"
      >
        {loading ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
