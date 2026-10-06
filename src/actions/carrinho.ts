"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth/guards";
import { obterOuCriarRascunho, obterRascunho } from "@/lib/consultas/solicitacoes";
import { QUANTIDADE_MAXIMA } from "@/lib/regras/estimativa";
import type { EstadoForm } from "@/lib/validacao/comum";

const esquemaItem = z.object({
  produtoId: z.string().min(1),
  quantidade: z.coerce
    .number({ error: "Informe a quantidade." })
    .int({ error: "A quantidade deve ser um número inteiro." })
    .min(1, { error: "A quantidade mínima é 1." })
    .max(QUANTIDADE_MAXIMA, { error: "Quantidade muito alta." }),
});

function revalidarCarrinho() {
  revalidatePath("/minha-solicitacao");
  revalidatePath("/", "layout"); // contador do carrinho na navegação
}

/** Adiciona o produto ao carrinho (rascunho). Se já estiver lá, substitui a quantidade. */
export async function adicionarAoCarrinho(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuario();
  const dados = esquemaItem.safeParse(Object.fromEntries(formData));
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };

  const produto = await db.produto.findFirst({ where: { id: dados.data.produtoId, ativo: true }, select: { id: true } });
  if (!produto) return { erro: "Produto indisponível." };

  const rascunho = await obterOuCriarRascunho(usuario);
  const existente = await db.itemSolicitacao.findUnique({
    where: { solicitacaoId_produtoId: { solicitacaoId: rascunho.id, produtoId: produto.id } },
  });
  await db.itemSolicitacao.upsert({
    where: { solicitacaoId_produtoId: { solicitacaoId: rascunho.id, produtoId: produto.id } },
    update: { quantidade: dados.data.quantidade },
    create: { solicitacaoId: rascunho.id, produtoId: produto.id, quantidade: dados.data.quantidade },
  });
  revalidarCarrinho();
  return {
    sucesso: existente
      ? `Quantidade atualizada para ${dados.data.quantidade} na sua solicitação.`
      : "Item adicionado à sua solicitação.",
  };
}

/** Altera a quantidade de um item do carrinho do próprio usuário. */
export async function alterarQuantidadeItem(formData: FormData): Promise<void> {
  const usuario = await exigirUsuario();
  const itemId = String(formData.get("itemId") ?? "");
  const quantidade = esquemaItem.shape.quantidade.safeParse(formData.get("quantidade"));
  if (!quantidade.success) throw new Error(quantidade.error.issues[0]?.message ?? "Quantidade inválida.");

  const rascunho = await obterRascunho(usuario.id);
  if (!rascunho) throw new Error("Você não tem uma solicitação em rascunho.");
  // updateMany com solicitacaoId garante que o item é do carrinho deste usuário.
  await db.itemSolicitacao.updateMany({
    where: { id: itemId, solicitacaoId: rascunho.id },
    data: { quantidade: quantidade.data },
  });
  revalidarCarrinho();
}

export async function removerItem(formData: FormData): Promise<void> {
  const usuario = await exigirUsuario();
  const itemId = String(formData.get("itemId") ?? "");
  const rascunho = await obterRascunho(usuario.id);
  if (!rascunho) return;
  await db.itemSolicitacao.deleteMany({ where: { id: itemId, solicitacaoId: rascunho.id } });
  revalidarCarrinho();
}
