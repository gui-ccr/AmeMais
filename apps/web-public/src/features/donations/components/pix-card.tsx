import Image from "next/image";
import { CopyPixButton } from "./copy-pix-button";

const QR_URL =
  "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" +
  encodeURIComponent("PIX AmeMais: pix@amemais.org.br");

export function PixCard() {
  return (
    <div className="rounded-2xl border-2 border-primary bg-primary-light p-6.5 text-center">
      <h2 className="font-display text-4xl font-bold">Doe via PIX</h2>
      <Image
        src={QR_URL}
        alt="QR Code do PIX da AmeMais"
        width={180}
        height={180}
        className="mx-auto my-4 rounded-lg border-2 border-border bg-white p-2"
      />
      <CopyPixButton />
      <p className="mt-2.5 text-base text-muted-foreground">
        chave e-mail · CNPJ 00.000.000/0001-00 · AmeMais Proteção Animal
      </p>
    </div>
  );
}
