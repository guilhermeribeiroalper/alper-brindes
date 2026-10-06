"use server";

import * as z from "zod";
import { exigirUsuario } from "@/lib/auth/guards";
import { estimarProduto } from "@/lib/consultas/catalogo";
import type { Estimativa } from "@/lib/regras/estimativa";

const entrada = z.object({ produtoId: z.string().min(1), quantidade: z.number() });

/** Estimativa imediata para o simulador. Devolve só a faixa agregada, nunca fornecedores. */
export async function simularEstimativa(produtoId: string, quantidade: number): Promise<Estimativa> {
  await exigirUsuario();
  const dados = entrada.safeParse({ produtoId, quantidade });
  if (!dados.success) return { disponivel: false, quantidade: 0, motivo: "QUANTIDADE_INVALIDA" };
  return estimarProduto(dados.data.produtoId, dados.data.quantidade);
}
