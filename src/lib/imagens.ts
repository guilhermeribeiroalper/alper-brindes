// Imagens ilustrativas para produtos sem foto cadastrada (CC0, ver docs/CREDITOS-IMAGENS.md).
export const IMAGENS_PADRAO_PRODUTO = [
  "/imagens/produtos/padrao-1.jpg",
  "/imagens/produtos/padrao-2.jpg",
  "/imagens/produtos/padrao-3.jpg",
  "/imagens/produtos/padrao-4.jpg",
  "/imagens/produtos/padrao-5.jpg",
  "/imagens/produtos/padrao-6.jpg",
] as const;

/**
 * Escolhe uma imagem padrão a partir do id do produto. A escolha parece aleatória,
 * mas é estável: o mesmo produto mostra sempre a mesma imagem.
 */
export function imagemPadraoProduto(produtoId: string): string {
  let hash = 0;
  for (const caractere of produtoId) hash = (hash * 31 + caractere.charCodeAt(0)) >>> 0;
  return IMAGENS_PADRAO_PRODUTO[hash % IMAGENS_PADRAO_PRODUTO.length];
}
