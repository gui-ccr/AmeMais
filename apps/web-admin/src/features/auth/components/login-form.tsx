"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "../services/auth-service";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.signIn(email, password);
      router.push("/admin");
    } catch {
      setError("E-mail ou senha inválidos");
    } finally {
      setLoading(false);
    }
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
          hasError={!!error}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" required>
          Senha
        </Label>
        <Input
          id="password"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          hasError={!!error}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full mt-2">
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

