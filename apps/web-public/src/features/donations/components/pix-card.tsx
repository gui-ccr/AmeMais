import Image from "next/image";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CopyPixButton } from "./copy-pix-button";

const QR_URL =
  "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" +
  encodeURIComponent("PIX AmeMais: pix@amemais.org.br");

/**
 * The PIX key rendered as a two-part raffle ticket: a stub with the key on
 * the left, a perforated tear line, and the "admit one" QR half on the
 * right — a shape borrowed from real bake-sale/raffle fundraising, not a
 * generic donation card.
 */
export function PixCard() {
  return (
    <div className="mx-auto max-w-3xl -rotate-1">
      <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-primary shadow-[0_10px_28px_rgba(46,42,38,.16)] sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-3 bg-primary-light p-7">
          <Eyebrow>Doe via PIX</Eyebrow>
          <h2 className="font-display text-4xl leading-none font-bold">Cada real vira ração e resgate.</h2>
          <CopyPixButton />
          <p className="text-sm text-muted-foreground">
            chave e-mail · CNPJ 00.000.000/0001-00 · AmeMais Proteção Animal
          </p>
        </div>

        <div
          aria-hidden="true"
          className="relative hidden w-0 border-l-2 border-dashed border-primary sm:block"
        >
          <span className="absolute -top-3 -left-3 size-6 rounded-full border-2 border-primary bg-brand-cream" />
          <span className="absolute -bottom-3 -left-3 size-6 rounded-full border-2 border-primary bg-brand-cream" />
        </div>
        <div
          aria-hidden="true"
          className="mx-6 block border-t-2 border-dashed border-primary sm:hidden"
        />

        <div className="relative flex flex-col items-center justify-center gap-1 bg-white p-7">
          <span className="font-display text-2xl text-primary">aponte a câmera aqui</span>
          <svg viewBox="0 0 60 34" className="h-8 w-14 text-primary" aria-hidden="true">
            <path
              d="M4 4 C 10 22, 30 26, 50 22"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <path d="M50 22 L 42 18 M50 22 L 45 29" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
          <Image
            src={QR_URL}
            alt="QR Code do PIX da AmeMais"
            width={168}
            height={168}
            className="rotate-1 rounded-lg border-2 border-border bg-white p-2"
          />
        </div>
      </div>
    </div>
  );
}
