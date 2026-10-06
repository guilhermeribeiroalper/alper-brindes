import { describe, expect, it } from "vitest";
import {
  AVISO_ESTIMATIVA,
  calcularEstimativa,
  faixaReferencia,
  situacaoPreco,
  somarEstimativas,
  type PrecoParaEstimativa,
} from "@/lib/regras/estimativa";

const HOJE = new Date("2026-10-06T00:00:00.000Z");
const ONTEM = new Date("2026-10-05T00:00:00.000Z");
const FUTURO = new Date("2027-01-31T00:00:00.000Z");

function preco(p: Partial<PrecoParaEstimativa> & Pick<PrecoParaEstimativa, "fornecedorId" | "valorUnitarioCentavos">): PrecoParaEstimativa {
  return {
    quantidadeMinima: 1,
    prazoEntregaDias: 10,
    validadeEstimativa: FUTURO,
    ativo: true,
    fornecedorAtivo: true,
    ...p,
  };
}

// Cenário base: fornecedor A com duas faixas, fornecedor B com uma faixa a partir de 50.
const PRECOS = [
  preco({ fornecedorId: "A", valorUnitarioCentavos: 1890, quantidadeMinima: 1, prazoEntregaDias: 10 }),
  preco({ fornecedorId: "A", valorUnitarioCentavos: 1490, quantidadeMinima: 100, prazoEntregaDias: 12 }),
  preco({ fornecedorId: "B", valorUnitarioCentavos: 1690, quantidadeMinima: 50, prazoEntregaDias: 15 }),
];

const estimar = (quantidade: number, precos = PRECOS, produtoAtivo = true) =>
  calcularEstimativa({ quantidade, precos, hoje: HOJE, produtoAtivo });

describe("faixas de quantidade", () => {
  it("usa só as faixas cuja quantidade mínima é atendida", () => {
    expect(estimar(1)).toMatchObject({
      disponivel: true,
      totalMinimoCentavos: 1890,
      totalMaximoCentavos: 1890,
      prazoMinDias: 10,
      prazoMaxDias: 10,
      opcoes: 1,
    });
  });

  it("mostra a faixa do menor ao maior total entre fornecedores", () => {
    expect(estimar(60)).toMatchObject({
      disponivel: true,
      totalMinimoCentavos: 1690 * 60,
      totalMaximoCentavos: 1890 * 60,
      unitarioMinimoCentavos: 1690,
      unitarioMaximoCentavos: 1890,
      prazoMinDias: 10,
      prazoMaxDias: 15,
      opcoes: 2,
    });
  });

  it("de cada fornecedor usa a faixa de maior quantidade mínima atendida (S1)", () => {
    // Em 150 un. o fornecedor A cobra 14,90 (faixa de 100), não 18,90 (faixa de 1).
    const e = estimar(150);
    expect(e).toMatchObject({ totalMinimoCentavos: 1490 * 150, totalMaximoCentavos: 1690 * 150, opcoes: 2 });
    expect(e).toMatchObject({ prazoMinDias: 12, prazoMaxDias: 15 });
  });

  it("vale exatamente na quantidade mínima (limite inclusivo)", () => {
    expect(estimar(100)).toMatchObject({ totalMinimoCentavos: 1490 * 100 });
    expect(estimar(99)).toMatchObject({ totalMinimoCentavos: 1690 * 99, totalMaximoCentavos: 1890 * 99 });
  });

  it("em empate de quantidade mínima no mesmo fornecedor, usa o menor valor", () => {
    const precos = [
      preco({ fornecedorId: "A", valorUnitarioCentavos: 1000, quantidadeMinima: 10 }),
      preco({ fornecedorId: "A", valorUnitarioCentavos: 900, quantidadeMinima: 10 }),
    ];
    expect(estimar(10, precos)).toMatchObject({ totalMinimoCentavos: 9000, totalMaximoCentavos: 9000, opcoes: 1 });
  });
});

describe("quantidade mínima não atendida", () => {
  it("informa que precisa de cotação formal e a menor quantidade com referência", () => {
    const precos = [preco({ fornecedorId: "A", valorUnitarioCentavos: 450, quantidadeMinima: 100 })];
    expect(estimar(50, precos)).toEqual({
      disponivel: false,
      quantidade: 50,
      motivo: "SEM_PRECO_APLICAVEL",
      quantidadeMinimaDisponivel: 100,
    });
  });
});

describe("validade da estimativa", () => {
  it("ignora preços vencidos", () => {
    const precos = [
      preco({ fornecedorId: "A", valorUnitarioCentavos: 3590, validadeEstimativa: ONTEM }),
      preco({ fornecedorId: "B", valorUnitarioCentavos: 4290 }),
    ];
    expect(estimar(20, precos)).toMatchObject({ totalMinimoCentavos: 4290 * 20, totalMaximoCentavos: 4290 * 20, opcoes: 1 });
  });

  it("aceita preço que vence hoje (validade inclusiva)", () => {
    const precos = [preco({ fornecedorId: "A", valorUnitarioCentavos: 1000, validadeEstimativa: HOJE })];
    expect(estimar(1, precos)).toMatchObject({ disponivel: true, totalMinimoCentavos: 1000 });
  });

  it("sem cotação formal possível quando todos estão vencidos", () => {
    const precos = [preco({ fornecedorId: "A", valorUnitarioCentavos: 1000, validadeEstimativa: ONTEM })];
    expect(estimar(1, precos)).toEqual({
      disponivel: false,
      quantidade: 1,
      motivo: "SEM_PRECO_APLICAVEL",
      quantidadeMinimaDisponivel: undefined,
    });
  });
});

describe("sem preço aplicável", () => {
  it("produto sem nenhum preço", () => {
    expect(estimar(10, [])).toMatchObject({ disponivel: false, motivo: "SEM_PRECO_APLICAVEL" });
  });

  it("ignora preços inativos e de fornecedores inativos", () => {
    const precos = [
      preco({ fornecedorId: "A", valorUnitarioCentavos: 1000, ativo: false }),
      preco({ fornecedorId: "B", valorUnitarioCentavos: 1100, fornecedorAtivo: false }),
    ];
    expect(estimar(10, precos)).toMatchObject({ disponivel: false, motivo: "SEM_PRECO_APLICAVEL" });
  });

  it("produto inativo não gera estimativa", () => {
    expect(estimar(10, PRECOS, false)).toMatchObject({ disponivel: false, motivo: "PRODUTO_INATIVO" });
  });

  it.each([0, -5, 1.5, Number.NaN, 2_000_000])("quantidade inválida: %s", (q) => {
    expect(estimar(q)).toMatchObject({ disponivel: false, motivo: "QUANTIDADE_INVALIDA" });
  });
});

describe("sigilo dos fornecedores", () => {
  it("o resultado não contém identificação de fornecedor", () => {
    const e = estimar(150);
    expect(JSON.stringify(e)).not.toMatch(/"A"|"B"|fornecedor/i);
  });

  it("o aviso padrão é o texto exigido", () => {
    expect(AVISO_ESTIMATIVA).toBe("Valor estimado, sujeito a confirmação pelo administrador.");
  });
});

describe("situação do preço", () => {
  it.each([
    [{}, "VIGENTE"],
    [{ validadeEstimativa: ONTEM }, "VENCIDO"],
    [{ ativo: false }, "INATIVO"],
    [{ fornecedorAtivo: false }, "FORNECEDOR_INATIVO"],
  ] as const)("%o → %s", (ajuste, esperado) => {
    expect(situacaoPreco(preco({ fornecedorId: "A", valorUnitarioCentavos: 1, ...ajuste }), HOJE)).toBe(esperado);
  });
});

describe("faixa de referência do catálogo", () => {
  it("usa todos os preços vigentes, sem filtrar quantidade (S4)", () => {
    expect(faixaReferencia(PRECOS, HOJE)).toEqual({
      unitarioMinimoCentavos: 1490,
      unitarioMaximoCentavos: 1890,
      quantidadeMinima: 1,
    });
  });

  it("é nula sem preço vigente ou com produto inativo", () => {
    expect(faixaReferencia([], HOJE)).toBeNull();
    expect(faixaReferencia(PRECOS, HOJE, false)).toBeNull();
  });
});

describe("total da lista", () => {
  it("soma as faixas e deixa de fora itens sem preço (S6)", () => {
    expect(
      somarEstimativas([
        { minimoCentavos: 1000, maximoCentavos: 1500 },
        { minimoCentavos: null, maximoCentavos: null },
        { minimoCentavos: 200, maximoCentavos: 200 },
      ]),
    ).toEqual({ totalMinimoCentavos: 1200, totalMaximoCentavos: 1700, itensComPreco: 2, itensSemPreco: 1 });
  });
});
