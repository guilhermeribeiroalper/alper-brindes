"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { errosDeValidacao, type EstadoForm } from "@/lib/validacao/comum";
import { esquemaProduto } from "@/lib/validacao/cadastros";

export async function salvarProduto(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirAdmin();
  const dados = esquemaProduto.safeParse(Object.fromEntries(formData));
  if (!dados.success) return errosDeValidacao(dados.error, formData);

  let id = String(formData.get("id") ?? "");
  if (id) {
    await db.produto.update({ where: { id }, data: dados.data });
  } else {
    id = (await db.produto.create({ data: dados.data })).id;
  }
  revalidatePath("/admin/produtos");
  revalidatePath("/catalogo");
  // Produto novo: segue direto para o cadastro de preços.
  redirect(formData.get("id") ? "/admin/produtos" : `/admin/produtos/${id}/precos`);
}

export async function alterarAtivoProduto(formData: FormData): Promise<void> {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  await db.produto.update({ where: { id }, data: { ativo: formData.get("ativo") === "true" } });
  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${id}`);
  revalidatePath("/catalogo");
}
