import { describe, expect, it, vi } from "vitest";
import {
  configuracaoClickUp,
  criarTarefaClickUp,
  ErroClickUp,
  montarTarefaClickUp,
  type DadosAprovacao,
} from "@/lib/integracoes/clickup";

const DADOS: DadosAprovacao = {
  solicitacaoId: "cmux2img90001jonmkzmph87f",
  solicitante: { nome: "Maria Souza", email: "maria@alper.com.br" },
  departamento: "Marketing",
  dataNecessaria: new Date("2026-11-20T00:00:00.000Z"),
  justificativa: "Evento de clientes | 200 convidados",
  itens: [
    { produto: "Caneca de cerâmica 325 ml", quantidade: 200, estimativaMinimaCentavos: 298000, estimativaMaximaCentavos: 338000 },
    { produto: "Mochila para notebook", quantidade: 30, estimativaMinimaCentavos: null, estimativaMaximaCentavos: null },
  ],
  valorTotalFinalCentavos: 315000,
  fornecedor: "Brindes Exemplo Ltda.",
  prazoEntregaDias: 14,
  observacoes: "Inclui gravação do logo.",
  aprovadoPor: "Administrador",
  aprovadaEm: new Date("2026-10-07T18:00:00.000Z"),
};

const CONFIG = { token: "pk_teste", listId: "901", baseUrl: "https://api.exemplo.test/v2" };

describe("conteúdo da tarefa", () => {
  const tarefa = montarTarefaClickUp(DADOS);

  it("título com código da solicitação e departamento", () => {
    expect(tarefa.name).toBe("Brindes aprovados #MPH87F · Marketing");
  });

  it("lista os brindes com quantidade e estimativa", () => {
    const md = tarefa.markdown_content.replace(/ /g, " ");
    expect(md).toContain("| Caneca de cerâmica 325 ml | 200 | R$ 2.980,00 a R$ 3.380,00 |");
    expect(md).toContain("| Mochila para notebook | 30 | Sem estimativa (cotação formal) |");
  });

  it("traz fornecedor, valor final, prazo, solicitante e justificativa", () => {
    const md = tarefa.markdown_content.replace(/ /g, " ");
    expect(md).toContain("**Valor total final:** R$ 3.150,00");
    expect(md).toContain("**Fornecedor:** Brindes Exemplo Ltda.");
    expect(md).toContain("**Prazo de entrega:** 14 dias");
    expect(md).toContain("Maria Souza (maria@alper.com.br)");
    expect(md).toContain("**Data necessária:** 20/11/2026");
    expect(md).toContain("**Justificativa:** Evento de clientes | 200 convidados");
  });

  it("usa a data necessária como prazo, ao meio-dia de Brasília", () => {
    expect(new Date(tarefa.due_date!).toISOString()).toBe("2026-11-20T15:00:00.000Z");
    expect(montarTarefaClickUp({ ...DADOS, dataNecessaria: null }).due_date).toBeUndefined();
  });

  it("escapa barras verticais dentro da tabela", () => {
    const t = montarTarefaClickUp({ ...DADOS, itens: [{ ...DADOS.itens[0], produto: "Kit A | B" }] });
    expect(t.markdown_content).toContain("| Kit A \\| B | 200 |");
  });
});

describe("configuração", () => {
  it("exige token e lista", () => {
    expect(configuracaoClickUp({})).toBeNull();
    expect(configuracaoClickUp({ CLICKUP_API_TOKEN: "pk_x" })).toBeNull();
    expect(configuracaoClickUp({ CLICKUP_API_TOKEN: "pk_x", CLICKUP_LIST_ID: "123" })).toEqual({
      token: "pk_x",
      listId: "123",
      baseUrl: "https://api.clickup.com/api/v2",
    });
  });
});

describe("chamada à API", () => {
  it("faz POST na lista com o token no header Authorization", async () => {
    const fetchFalso = vi.fn(async () => Response.json({ id: "86abc", url: "https://app.clickup.com/t/86abc" }));
    const resultado = await criarTarefaClickUp(montarTarefaClickUp(DADOS), CONFIG, fetchFalso as unknown as typeof fetch);

    expect(resultado).toEqual({ id: "86abc", url: "https://app.clickup.com/t/86abc" });
    const [url, init] = fetchFalso.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.exemplo.test/v2/list/901/task");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("pk_teste");
    expect(JSON.parse(String(init.body)).name).toBe("Brindes aprovados #MPH87F · Marketing");
  });

  it("monta o link quando a API não devolve url", async () => {
    const fetchFalso = vi.fn(async () => Response.json({ id: "86xyz" }));
    const r = await criarTarefaClickUp(montarTarefaClickUp(DADOS), CONFIG, fetchFalso as unknown as typeof fetch);
    expect(r.url).toBe("https://app.clickup.com/t/86xyz");
  });

  it("transforma recusa da API em erro legível", async () => {
    const fetchFalso = vi.fn(async () => Response.json({ err: "Token invalid", ECODE: "OAUTH_025" }, { status: 401 }));
    await expect(criarTarefaClickUp(montarTarefaClickUp(DADOS), CONFIG, fetchFalso as unknown as typeof fetch)).rejects.toThrow(
      new ErroClickUp("O ClickUp recusou a criação da tarefa (HTTP 401): Token invalid (OAUTH_025)."),
    );
  });

  it("transforma falha de rede em erro legível", async () => {
    const fetchFalso = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(criarTarefaClickUp(montarTarefaClickUp(DADOS), CONFIG, fetchFalso as unknown as typeof fetch)).rejects.toThrow(
      "Não foi possível conectar ao ClickUp (TypeError).",
    );
  });
});
