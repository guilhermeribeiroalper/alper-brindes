import "server-only";
import { db } from "@/lib/db";
import { configuracaoClickUp, criarTarefaClickUp, ErroClickUp, montarTarefaClickUp } from "@/lib/integracoes/clickup";

// Tempo após o qual uma trava de envio é considerada abandonada (ex.: servidor reiniciado no meio).
const TRAVA_EXPIRA_MS = 2 * 60 * 1000;

export type ResultadoSincronizacao = { ok: true; url: string } | { ok: false; erro: string };

/**
 * Cria a tarefa no ClickUp de uma solicitação APROVADA, se ainda não existir.
 * Nunca lança: o resultado (link ou erro) fica gravado na resposta da cotação.
 */
export async function sincronizarClickUp(solicitacaoId: string): Promise<ResultadoSincronizacao> {
  // Trava: só uma criação por vez, e só se ainda não houver tarefa.
  const { count } = await db.respostaCotacao.updateMany({
    where: {
      solicitacaoId,
      clickupTaskId: null,
      solicitacao: { status: "APROVADA" },
      OR: [{ clickupEnviandoDesde: null }, { clickupEnviandoDesde: { lt: new Date(Date.now() - TRAVA_EXPIRA_MS) } }],
    },
    data: { clickupEnviandoDesde: new Date() },
  });
  if (count !== 1) return { ok: false, erro: "A tarefa já foi criada ou há um envio em andamento." };

  const registrarErro = async (erro: string): Promise<ResultadoSincronizacao> => {
    await db.respostaCotacao.update({
      where: { solicitacaoId },
      data: { clickupErro: erro, clickupEnviandoDesde: null },
    });
    return { ok: false, erro };
  };

  const config = configuracaoClickUp();
  if (!config) {
    return registrarErro("Integração com o ClickUp não configurada (defina CLICKUP_API_TOKEN e CLICKUP_LIST_ID).");
  }

  const solicitacao = await db.solicitacaoCotacao.findUniqueOrThrow({
    where: { id: solicitacaoId },
    include: {
      solicitante: { select: { nome: true, email: true } },
      itens: { include: { produto: { select: { nome: true } } }, orderBy: { produto: { nome: "asc" } } },
      resposta: {
        include: { admin: { select: { nome: true } }, fornecedorEscolhido: { select: { nome: true } } },
      },
    },
  });
  const resposta = solicitacao.resposta!;

  const tarefa = montarTarefaClickUp({
    solicitacaoId: solicitacao.id,
    solicitante: solicitacao.solicitante,
    departamento: solicitacao.departamento,
    dataNecessaria: solicitacao.dataNecessaria,
    justificativa: solicitacao.justificativa,
    itens: solicitacao.itens.map((i) => ({
      produto: i.produto.nome,
      quantidade: i.quantidade,
      estimativaMinimaCentavos: i.estimativaMinimaCentavos,
      estimativaMaximaCentavos: i.estimativaMaximaCentavos,
    })),
    valorTotalFinalCentavos: resposta.valorTotalFinalCentavos,
    fornecedor: resposta.fornecedorEscolhido?.nome ?? null,
    prazoEntregaDias: resposta.prazoEntregaDias,
    observacoes: resposta.observacoes,
    aprovadoPor: resposta.admin.nome,
    aprovadaEm: resposta.respondidaEm,
  });

  try {
    const criada = await criarTarefaClickUp(tarefa, config);
    await db.respostaCotacao.update({
      where: { solicitacaoId },
      data: { clickupTaskId: criada.id, clickupTaskUrl: criada.url, clickupErro: null, clickupEnviandoDesde: null },
    });
    return { ok: true, url: criada.url };
  } catch (erro) {
    const mensagem = erro instanceof ErroClickUp ? erro.message : "Erro inesperado ao criar a tarefa no ClickUp.";
    if (!(erro instanceof ErroClickUp)) console.error("Falha na integração com o ClickUp", erro);
    return registrarErro(mensagem);
  }
}
