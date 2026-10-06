"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { errosDeValidacao, type EstadoForm } from "@/lib/validacao/comum";
import { esquemaFornecedor } from "@/lib/validacao/cadastros";

export async function salvarFornecedor(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirAdmin();
  const dados = esquemaFornecedor.safeParse(Object.fromEntries(formData));
  if (!dados.success) return errosDeValidacao(dados.error, formData);

  const id = String(formData.get("id") ?? "");
  if (id) {
    await db.fornecedor.update({ where: { id }, data: dados.data });
  } else {
    await db.fornecedor.create({ data: dados.data });
  }
  revalidatePath("/admin/fornecedores");
  redirect("/admin/fornecedores");
}

export async function alterarAtivoFornecedor(formData: FormData): Promise<void> {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  await db.fornecedor.update({ where: { id }, data: { ativo: formData.get("ativo") === "true" } });
  revalidatePath("/admin/fornecedores");
  revalidatePath(`/admin/fornecedores/${id}`);
}
