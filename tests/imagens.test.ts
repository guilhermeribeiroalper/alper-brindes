import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { IMAGENS_PADRAO_PRODUTO, imagemPadraoProduto } from "@/lib/imagens";

describe("imagem padrão de produto", () => {
  it("é estável para o mesmo produto", () => {
    expect(imagemPadraoProduto("cmux2f5c60004s0nmihos1sk8")).toBe(imagemPadraoProduto("cmux2f5c60004s0nmihos1sk8"));
  });

  it("distribui produtos diferentes entre várias imagens", () => {
    const usadas = new Set(Array.from({ length: 60 }, (_, i) => imagemPadraoProduto(`produto-${i}`)));
    expect(usadas.size).toBeGreaterThan(3);
  });

  it("todas as imagens da lista existem em public/", () => {
    for (const caminho of IMAGENS_PADRAO_PRODUTO) {
      expect(existsSync(join(__dirname, "..", "public", caminho))).toBe(true);
    }
  });
});
