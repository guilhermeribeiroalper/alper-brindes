// Integração com o ClickUp (API v2): cria uma tarefa quando uma solicitação é aprovada.
// Referência: POST /v2/list/{list_id}/task, header "Authorization: <token pessoal>".
// Configuração no .env: CLICKUP_API_TOKEN e CLICKUP_LIST_ID (CLICKUP_API_URL é opcional).

import { codigoSolicitacao, formatarBRL, formatarData, formatarDataHora } from "@/lib/formatacao";

export type ConfiguracaoClickUp = { token: string; listId: string; baseUrl: string };

export const CLICKUP_API_URL_PADRAO = "https://api.clickup.com/api/v2";

/** Configuração a partir das variáveis de ambiente, ou null se a integração não estiver configurada. */
export function configuracaoClickUp(env: Record<string, string | undefined> = process.env): ConfiguracaoClickUp | null {
  const token = env.CLICKUP_API_TOKEN?.trim();
  const listId = env.CLICKUP_LIST_ID?.trim();
  if (!token || !listId) return null;
  return { token, listId, baseUrl: (env.CLICKUP_API_URL?.trim() || CLICKUP_API_URL_PADRAO).replace(/\/+$/, "") };
}

export type DadosAprovacao = {
  solicitacaoId: string;
  solicitante: { nome: string; email: string };
  departamento: string;
  dataNecessaria: Date | null;
  justificativa: string | null;
  itens: {
    produto: string;
    quantidade: number;
    estimativaMinimaCentavos: number | null;
    estimativaMaximaCentavos: number | null;
  }[];
  valorTotalFinalCentavos: number;
  fornecedor: string | null;
  prazoEntregaDias: number;
  observacoes: string | null;
  aprovadoPor: string;
  aprovadaEm: Date;
};

export type TarefaClickUp = {
  name: string;
  markdown_content: string;
  due_date?: number;
  tags: string[];
};

/** Texto seguro dentro de uma célula de tabela markdown. */
function celula(texto: string): string {
  return texto.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function estimativa(min: number | null, max: number | null): string {
  if (min === null || max === null) return "Sem estimativa (cotação formal)";
  return min === max ? formatarBRL(min) : `${formatarBRL(min)} a ${formatarBRL(max)}`;
}

/** Monta o conteúdo da tarefa a partir da solicitação aprovada (função pura). */
export function montarTarefaClickUp(d: DadosAprovacao): TarefaClickUp {
  const codigo = codigoSolicitacao(d.solicitacaoId);
  const linhas = [
    `## Brindes aprovados — solicitação ${codigo}`,
    "",
    "### Itens",
    "",
    "| Produto | Quantidade | Estimativa no envio |",
    "|---|---:|---|",
    ...d.itens.map(
      (i) =>
        `| ${celula(i.produto)} | ${i.quantidade.toLocaleString("pt-BR")} | ${estimativa(i.estimativaMinimaCentavos, i.estimativaMaximaCentavos)} |`,
    ),
    "",
    "### Aprovação",
    "",
    `- **Valor total final:** ${formatarBRL(d.valorTotalFinalCentavos)}`,
    `- **Fornecedor:** ${d.fornecedor ?? "Não informado"}`,
    `- **Prazo de entrega:** ${d.prazoEntregaDias} ${d.prazoEntregaDias === 1 ? "dia" : "dias"}`,
    `- **Aprovado por:** ${d.aprovadoPor} em ${formatarDataHora(d.aprovadaEm)}`,
    ...(d.observacoes ? ["", `**Observações:** ${d.observacoes}`] : []),
    "",
    "### Solicitante",
    "",
    `- **Nome:** ${d.solicitante.nome} (${d.solicitante.email})`,
    `- **Departamento:** ${d.departamento}`,
    `- **Data necessária:** ${d.dataNecessaria ? formatarData(d.dataNecessaria) : "Não informada"}`,
    ...(d.justificativa ? ["", `**Justificativa:** ${d.justificativa}`] : []),
  ];

  return {
    name: `Brindes aprovados ${codigo} · ${d.departamento}`,
    markdown_content: linhas.join("\n"),
    // Data civil guardada à meia-noite UTC: usa 15:00 UTC (12:00 em Brasília) para não
    // cair no dia anterior no fuso do Brasil.
    ...(d.dataNecessaria ? { due_date: d.dataNecessaria.getTime() + 15 * 60 * 60 * 1000 } : {}),
    tags: ["brindes"],
  };
}

export class ErroClickUp extends Error {}

/** Cria a tarefa na lista configurada. Lança ErroClickUp com mensagem legível em caso de falha. */
export async function criarTarefaClickUp(
  tarefa: TarefaClickUp,
  config: ConfiguracaoClickUp,
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string; url: string }> {
  let resposta: Response;
  try {
    resposta = await fetchImpl(`${config.baseUrl}/list/${encodeURIComponent(config.listId)}/task`, {
      method: "POST",
      headers: { Authorization: config.token, "Content-Type": "application/json" },
      body: JSON.stringify(tarefa),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (erro) {
    throw new ErroClickUp(`Não foi possível conectar ao ClickUp (${(erro as Error).name}).`);
  }

  const corpo = (await resposta.json().catch(() => ({}))) as { id?: string; url?: string; err?: string; ECODE?: string };
  if (!resposta.ok || !corpo.id) {
    const detalhe = corpo.err ? `: ${corpo.err}${corpo.ECODE ? ` (${corpo.ECODE})` : ""}` : "";
    throw new ErroClickUp(`O ClickUp recusou a criação da tarefa (HTTP ${resposta.status})${detalhe}.`);
  }
  return { id: corpo.id, url: corpo.url ?? `https://app.clickup.com/t/${corpo.id}` };
}
