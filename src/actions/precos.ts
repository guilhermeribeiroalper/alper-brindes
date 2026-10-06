"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { errosDeValidacao, valoresDoForm, type EstadoForm } from "@/lib/validacao/comum";
import { esquemaPreco } from "@/lib/validacao/cadastros";

function revalidar(produtoId: string) {
  revalidatePath(`/admin/produtos/${produtoId}/precos`);
  revalidatePath("/catalogo");
}

/** Cria ou atualiza um PrecoFornecedor. Mudança de valor gera registro em HistoricoPreco. */
export async function salvarPreco(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const admin = await exigirAdmin();
  const dados = esquemaPreco.safeParse(Object.fromEntries(formData));
  if (!dados.success) return errosDeValidacao(dados.error, formData);

  const { valorUnitario, ...resto } = dados.data;
  const precoId = String(formData.get("id") ?? "");
  const produtoId = String(formData.get("produtoId") ?? "");

  const fornecedor = await db.fornecedor.findUnique({ where: { id: resto.fornecedorId }, select: { id: true } });
  if (!fornecedor) return { erro: "Fornecedor não encontrado.", errosCampo: { fornecedorId: ["Selecione o fornecedor."] }, valores: valoresDoForm(formData) };

  if (precoId) {
    const atual = await db.precoFornecedor.findUnique({ where: { id: precoId } });
    if (!atual) return { erro: "Preço não encontrado." };
    await db.$transaction(async (tx) => {
      await tx.precoFornecedor.update({
        where: { id: precoId },
        data: { ...resto, valorUnitarioCentavos: valorUnitario },
      });
      if (atual.valorUnitarioCentavos !== valorUnitario) {
        await tx.historicoPreco.create({
          data: {
            precoFornecedorId: precoId,
            valorAnteriorCentavos: atual.valorUnitarioCentavos,
            valorNovoCentavos: valorUnitario,
            alteradoPorId: admin.id,
          },
        });
      }
    });
    revalidar(atual.produtoId);
    redirect(`/admin/produtos/${atual.produtoId}/precos`);
  }

  const produto = await db.produto.findUnique({ where: { id: produtoId }, select: { id: true } });
  if (!produto) return { erro: "Produto não encontrado." };
  await db.precoFornecedor.create({
    data: {
      ...resto,
      produtoId,
      valorUnitarioCentavos: valorUnitario,
      historico: {
        create: { valorAnteriorCentavos: null, valorNovoCentavos: valorUnitario, alteradoPorId: admin.id },
      },
    },
  });
  revalidar(produtoId);
  return { sucesso: "Preço cadastrado." };
}

export async function alterarAtivoPreco(formData: FormData): Promise<void> {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const preco = await db.precoFornecedor.update({
    where: { id },
    data: { ativo: formData.get("ativo") === "true" },
    select: { produtoId: true },
  });
  revalidar(preco.produtoId);
}
