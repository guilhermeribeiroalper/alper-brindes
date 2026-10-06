import "server-only";
import { db } from "@/lib/db";

/** Fornecedores para o formulário de preço: ativos, mais o atual (se inativo) ao editar. */
export async function fornecedoresParaPreco(fornecedorAtualId?: string) {
  return db.fornecedor.findMany({
    where: fornecedorAtualId ? { OR: [{ ativo: true }, { id: fornecedorAtualId }] } : { ativo: true },
    select: { id: true, nome: true, ativo: true },
    orderBy: { nome: "asc" },
  });
}
