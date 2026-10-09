"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirAdmin, exigirUsuario } from "@/lib/auth/guards";
import { ehDonoDaSolicitacao } from "@/lib/auth/permissoes";
import { estimarItens } from "@/lib/consultas/catalogo";
import { obterRascunho } from "@/lib/consultas/solicitacoes";
import { validarTransicao, type StatusSolicitacao } from "@/lib/regras/status";
import { errosDeValidacao, valoresDoForm, type EstadoForm } from "@/lib/validacao/comum";
import { esquemaAprovacao, esquemaCancelamentoAdmin, esquemaEnvio } from "@/lib/validacao/solicitacao";
import { sincronizarClickUp } from "@/lib/integracoes/sincronizar-clickup";

/** Erro de concorrência: o status mudou entre a leitura e a gravação. */
class StatusAlterado extends Error {}

function revalidarSolicitacao(id: string) {
  revalidatePath("/solicitacoes");
  revalidatePath(`/solicitacoes/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/solicitacoes");
  revalidatePath(`/admin/solicitacoes/${id}`);
  revalidatePath("/", "layout");
}

/**
 * Transforma o rascunho em solicitação formal (RASCUNHO → ENVIADA).
 * As estimativas de cada item são calculadas agora e congeladas.
 */
export async function enviarSolicitacao(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuario();
  const dados = esquemaEnvio.safeParse(Object.fromEntries(formData));
  if (!dados.success) return errosDeValidacao(dados.error, formData);

  const rascunho = await obterRascunho(usuario.id);
  if (!rascunho) return { erro: "Você não tem itens na solicitação." };
  const transicao = validarTransicao(rascunho.status, "ENVIADA", {
    perfil: usuario.perfil,
    ehDono: ehDonoDaSolicitacao(usuario, rascunho),
  });
  if (!transicao.ok) return { erro: transicao.erro };

  const itens = await db.itemSolicitacao.findMany({
    where: { solicitacaoId: rascunho.id },
    include: { produto: { select: { nome: true, ativo: true } } },
  });
  if (itens.length === 0) return { erro: "Adicione pelo menos um item antes de enviar.", valores: valoresDoForm(formData) };
  const indisponiveis = itens.filter((i) => !i.produto.ativo).map((i) => i.produto.nome);
  if (indisponiveis.length) {
    return {
      erro: `Remova os itens que não estão mais disponíveis: ${indisponiveis.join(", ")}.`,
      valores: valoresDoForm(formData),
    };
  }

  const estimativas = await estimarItens(itens);
  try {
    await db.$transaction(async (tx) => {
      // Só envia se ainda estiver em rascunho (evita envio duplo).
      const { count } = await tx.solicitacaoCotacao.updateMany({
        where: { id: rascunho.id, status: "RASCUNHO" },
        data: { ...dados.data, status: "ENVIADA", enviadaEm: new Date() },
      });
      if (count !== 1) throw new StatusAlterado();
      for (const item of itens) {
        const e = estimativas.get(item.produtoId);
        const ok = e?.disponivel ? e : null;
        await tx.itemSolicitacao.update({
          where: { id: item.id },
          data: {
            estimativaMinimaCentavos: ok?.totalMinimoCentavos ?? null,
            estimativaMaximaCentavos: ok?.totalMaximoCentavos ?? null,
            prazoMinDias: ok?.prazoMinDias ?? null,
            prazoMaxDias: ok?.prazoMaxDias ?? null,
          },
        });
      }
    });
  } catch (erro) {
    if (erro instanceof StatusAlterado) return { erro: "Esta solicitação já foi enviada." };
    throw erro;
  }

  revalidarSolicitacao(rascunho.id);
  revalidatePath("/carrinho");
  redirect(`/solicitacoes/${rascunho.id}?enviada=1`);
}

/**
 * Muda o status conferindo a regra de transição e que o status não mudou nesse meio-tempo.
 * `atuandoComo` define qual regra vale: "DONO" (ações do solicitante) ou "ADMIN".
 */
async function transicionar(
  id: string,
  para: StatusSolicitacao,
  ator: { id: string; perfil: "ADMIN" | "SOLICITANTE" },
  atuandoComo: "DONO" | "ADMIN",
  dadosExtras: { canceladaEm?: Date; canceladaPorId?: string; motivoCancelamento?: string } = {},
) {
  const solicitacao = await db.solicitacaoCotacao.findUnique({ where: { id } });
  if (!solicitacao) throw new Error("Solicitação não encontrada.");
  const resultado = validarTransicao(solicitacao.status, para, {
    perfil: atuandoComo === "ADMIN" ? ator.perfil : "SOLICITANTE",
    ehDono: atuandoComo === "DONO" && solicitacao.solicitanteId === ator.id,
  });
  if (!resultado.ok) throw new Error(resultado.erro);

  const { count } = await db.solicitacaoCotacao.updateMany({
    where: { id, status: solicitacao.status },
    data: { status: para, ...dadosExtras },
  });
  if (count !== 1) throw new Error("A solicitação foi alterada por outra pessoa. Recarregue a página.");
  return solicitacao;
}

/** Solicitante cancela a própria solicitação (em RASCUNHO ou ENVIADA). */
export async function cancelarSolicitacao(formData: FormData): Promise<void> {
  const usuario = await exigirUsuario();
  const id = String(formData.get("id") ?? "");
  const anterior = await transicionar(id, "CANCELADA", usuario, "DONO", { canceladaEm: new Date() });
  revalidarSolicitacao(id);
  revalidatePath("/carrinho");
  if (anterior.status === "RASCUNHO") redirect("/carrinho");
}

/** Admin assume a solicitação (ENVIADA → EM_ANALISE). */
export async function iniciarAnalise(formData: FormData): Promise<void> {
  const admin = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  await transicionar(id, "EM_ANALISE", admin, "ADMIN");
  revalidarSolicitacao(id);
}

/** Admin cancela a solicitação com um motivo (em ENVIADA ou EM_ANALISE). */
export async function cancelarSolicitacaoAdmin(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const admin = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const dados = esquemaCancelamentoAdmin.safeParse(Object.fromEntries(formData));
  if (!dados.success) return errosDeValidacao(dados.error, formData);

  try {
    await transicionar(id, "CANCELADA", admin, "ADMIN", {
      canceladaEm: new Date(),
      canceladaPorId: admin.id,
      motivoCancelamento: dados.data.motivo,
    });
  } catch (erro) {
    return { erro: (erro as Error).message, valores: valoresDoForm(formData) };
  }
  revalidarSolicitacao(id);
  redirect(`/admin/solicitacoes/${id}`);
}

/**
 * Admin aprova a solicitação (EM_ANALISE → APROVADA), registrando valor final, fornecedor e prazo.
 * Depois de gravar, cria a tarefa no ClickUp; uma falha na integração não desfaz a aprovação.
 */
export async function aprovarSolicitacao(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const admin = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const dados = esquemaAprovacao.safeParse(Object.fromEntries(formData));
  if (!dados.success) return errosDeValidacao(dados.error, formData);

  const solicitacao = await db.solicitacaoCotacao.findUnique({ where: { id } });
  if (!solicitacao) return { erro: "Solicitação não encontrada." };
  const transicao = validarTransicao(solicitacao.status, "APROVADA", { perfil: admin.perfil, ehDono: false });
  if (!transicao.ok) return { erro: transicao.erro };

  if (dados.data.fornecedorEscolhidoId) {
    const existe = await db.fornecedor.findUnique({ where: { id: dados.data.fornecedorEscolhidoId }, select: { id: true } });
    if (!existe) return { erro: "Fornecedor inválido.", valores: valoresDoForm(formData) };
  }

  try {
    await db.$transaction(async (tx) => {
      const { count } = await tx.solicitacaoCotacao.updateMany({
        where: { id, status: "EM_ANALISE" },
        data: { status: "APROVADA" },
      });
      if (count !== 1) throw new StatusAlterado();
      await tx.respostaCotacao.create({
        data: {
          solicitacaoId: id,
          adminId: admin.id,
          valorTotalFinalCentavos: dados.data.valorTotalFinal,
          fornecedorEscolhidoId: dados.data.fornecedorEscolhidoId,
          prazoEntregaDias: dados.data.prazoEntregaDias,
          observacoes: dados.data.observacoes,
        },
      });
    });
  } catch (erro) {
    if (erro instanceof StatusAlterado) return { erro: "A solicitação já foi decidida ou mudou de status." };
    throw erro;
  }

  // Fora da transação: a chamada externa não pode segurar o banco nem desfazer a aprovação.
  await sincronizarClickUp(id);
  revalidarSolicitacao(id);
  redirect(`/admin/solicitacoes/${id}`);
}

/** Admin tenta de novo criar a tarefa no ClickUp de uma solicitação aprovada. */
export async function reenviarClickUp(formData: FormData): Promise<void> {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  await sincronizarClickUp(id);
  revalidarSolicitacao(id);
}
