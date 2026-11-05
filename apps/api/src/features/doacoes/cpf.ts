/** Confere os dígitos verificadores de um CPF (aceita com ou sem máscara). */
export function isValidCpf(valor: string): boolean {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false;

  const calcular = (tamanho: number) => {
    const soma = digitos
      .slice(0, tamanho)
      .split("")
      .reduce((acc, d, i) => acc + Number(d) * (tamanho + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcular(9) === Number(digitos[9]) && calcular(10) === Number(digitos[10]);
}
