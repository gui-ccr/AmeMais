import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "../src/core/errors";
import {
  TAMANHO_MAXIMO_IMAGEM_BYTES,
  detectarTipoDeImagem,
} from "../src/features/uploads/image-rules";
import { UploadImageUseCase, type ImageUploader } from "../src/features/uploads/upload-image.use-case";

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const WEBP = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
const HTML_RENOMEADO = new TextEncoder().encode("<html><script>alert(1)</script></html>");

describe("detectarTipoDeImagem", () => {
  it("reconhece JPEG, PNG e WebP pelos primeiros bytes", () => {
    expect(detectarTipoDeImagem(JPEG)).toBe("image/jpeg");
    expect(detectarTipoDeImagem(PNG)).toBe("image/png");
    expect(detectarTipoDeImagem(WEBP)).toBe("image/webp");
  });

  it("não se deixa enganar por um HTML renomeado para .jpg", () => {
    expect(detectarTipoDeImagem(HTML_RENOMEADO)).toBeNull();
  });

  it("recusa RIFF que não é WebP (ex.: um .wav)", () => {
    const wav = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]);
    expect(detectarTipoDeImagem(wav)).toBeNull();
  });

  it("recusa arquivo vazio ou curto demais", () => {
    expect(detectarTipoDeImagem(new Uint8Array())).toBeNull();
    expect(detectarTipoDeImagem(Uint8Array.from([0xff, 0xd8]))).toBeNull();
  });
});

describe("UploadImageUseCase", () => {
  function criarUseCase() {
    const uploader = vi.fn<ImageUploader>(async (path) => ({
      path,
      publicUrl: `https://storage.exemplo.com/animal-photos/${path}`,
    }));
    return { uploader, useCase: new UploadImageUseCase(uploader) };
  }

  it("envia a imagem numa pasta por tipo, com nome novo e extensão do tipo REAL", async () => {
    const { uploader, useCase } = criarUseCase();

    const resultado = await useCase.execute({ tipo: "animal", bytes: PNG });

    const [path, , contentType] = uploader.mock.calls[0]!;
    expect(path).toMatch(/^animais\/[0-9a-f-]{36}\.png$/);
    expect(contentType).toBe("image/png");
    expect(resultado.url).toBe(`https://storage.exemplo.com/animal-photos/${path}`);
    expect(resultado.path).toBe(path);
  });

  it("gera um nome diferente a cada envio", async () => {
    const { uploader, useCase } = criarUseCase();

    await useCase.execute({ tipo: "animal", bytes: JPEG });
    await useCase.execute({ tipo: "animal", bytes: JPEG });

    expect(uploader.mock.calls[0]![0]).not.toBe(uploader.mock.calls[1]![0]);
  });

  it("rejeita arquivo que não é imagem, sem chamar o Storage", async () => {
    const { uploader, useCase } = criarUseCase();

    await expect(useCase.execute({ tipo: "animal", bytes: HTML_RENOMEADO })).rejects.toThrow(ValidationError);
    expect(uploader).not.toHaveBeenCalled();
  });

  it("rejeita arquivo vazio", async () => {
    const { useCase } = criarUseCase();

    await expect(useCase.execute({ tipo: "animal", bytes: new Uint8Array() })).rejects.toThrow(ValidationError);
  });

  it("rejeita imagem acima de 4 MB e aceita exatamente 4 MB", async () => {
    const { useCase } = criarUseCase();
    const grande = new Uint8Array(TAMANHO_MAXIMO_IMAGEM_BYTES + 1);
    grande.set(JPEG);
    const noLimite = new Uint8Array(TAMANHO_MAXIMO_IMAGEM_BYTES);
    noLimite.set(JPEG);

    await expect(useCase.execute({ tipo: "animal", bytes: grande })).rejects.toThrow(/4 MB/);
    await expect(useCase.execute({ tipo: "animal", bytes: noLimite })).resolves.toBeDefined();
  });
});
