import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { checkPasswordStrength, MIN_PASSWORD_SCORE } from "@/lib/password-strength";

const SCORE_LABELS = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];
const SCORE_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-600",
];

interface PasswordStrengthMeterProps {
  password: string;
  userInputs?: string[];
}

export function usePasswordStrength(password: string, userInputs: string[] = []) {
  return useMemo(
    () => (password ? checkPasswordStrength(password, userInputs) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [password, ...userInputs],
  );
}

export function PasswordStrengthMeter({ password, userInputs = [] }: PasswordStrengthMeterProps) {
  const result = usePasswordStrength(password, userInputs);

  if (!password || !result) return null;

  const { score, feedback } = result;
  const message = feedback.warning || feedback.suggestions[0] || null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-secondary",
              index <= score && SCORE_COLORS[score],
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "text-xs",
          score < MIN_PASSWORD_SCORE ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {SCORE_LABELS[score]}
        {message ? ` — ${message}` : ""}
      </p>
    </div>
  );
}
