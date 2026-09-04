/**
 * Aplica a máscara de telefone brasileiro progressivamente: (00) 0000-0000
 * (fixo, até 10 dígitos) ou (00) 00000-0000 (celular, 11 dígitos).
 */
export function formatPhone(value: string): string {
  const numeros = value.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 10) {
    return numeros.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }

  return numeros.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}
