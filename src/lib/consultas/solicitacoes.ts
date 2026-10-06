import "server-only";
import { db } from "@/lib/db";

/** Rascunho (carrinho) do usuário, se existir. */
export function obterRascunho(usuarioId: string) {
  return db.solicitacaoCotacao.findFirst({
    where: { solicitanteId: usuarioId, status: "RASCUNHO" },
    orderBy: { criadaEm: "desc" },
  });
}

/** Rascunho do usuário, criando um vazio se necessário (S5: um carrinho por usuário). */
export async function obterOuCriarRascunho(usuario: { id: string; departamento: string }) {
  const existente = await obterRascunho(usuario.id);
  if (existente) return existente;
  return db.solicitacaoCotacao.create({
    data: { solicitanteId: usuario.id, departamento: usuario.departamento, status: "RASCUNHO" },
  });
}

/** Quantidade de itens no carrinho, para o indicador da navegação. */
export async function contarItensRascunho(usuarioId: string): Promise<number> {
  return db.itemSolicitacao.count({ where: { solicitacao: { solicitanteId: usuarioId, status: "RASCUNHO" } } });
}
