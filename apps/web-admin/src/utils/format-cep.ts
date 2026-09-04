/** Aplica a máscara 00000-000 progressivamente, conforme os dígitos entram. */
export function formatCEP(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}
