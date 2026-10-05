export function MensagemErro({ id, mensagem }: { id: string; mensagem?: string }) {
  if (!mensagem) return null;

  return (
    <p id={id} className="text-sm text-destructive font-medium">
      {mensagem}
    </p>
  );
}
