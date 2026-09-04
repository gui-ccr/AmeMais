/** Aplica a máscara DD/MM/AAAA progressivamente, conforme os dígitos entram. */
export function formatDateToBR(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");
}
