// Regras de estimativa de preço. Funções puras: recebem os preços já carregados
// e a data de hoje, para serem testadas sem banco.
//
// Regras (ver docs/SUPOSICOES.md, S1–S4):
// - Um preço é vigente quando ele e o fornecedor estão ativos e a validade é >= hoje.
// - Para a quantidade Q, de cada fornecedor vale a faixa vigente com a maior
//   quantidadeMinima <= Q (empate: a de menor valor).
// - A estimativa vai do menor ao maior total (Q × valorUnitario) entre os fornecedores.
// - O prazo é o intervalo entre o menor e o maior prazo das opções consideradas.

export type PrecoParaEstimativa = {
  fornecedorId: string;
  valorUnitarioCentavos: number;
  quantidadeMinima: number;
  prazoEntregaDias: number;
  /** Data civil (meia-noite UTC), último dia válido. */
  validadeEstimativa: Date;
  ativo: boolean;
  fornecedorAtivo: boolean;
};

export type SituacaoPreco = "VIGENTE" | "VENCIDO" | "INATIVO" | "FORNECEDOR_INATIVO";

export type Estimativa =
  | {
      disponivel: true;
      quantidade: number;
      totalMinimoCentavos: number;
      totalMaximoCentavos: number;
      unitarioMinimoCentavos: number;
      unitarioMaximoCentavos: number;
      prazoMinDias: number;
      prazoMaxDias: number;
      /** Número de fornecedores considerados (nunca expõe quais). */
      opcoes: number;
    }
  | {
      disponivel: false;
      quantidade: number;
      motivo: "QUANTIDADE_INVALIDA" | "PRODUTO_INATIVO" | "SEM_PRECO_APLICAVEL";
      /** Menor quantidade mínima vigente, se a falta de preço for só por quantidade baixa. */
      quantidadeMinimaDisponivel?: number;
    };

export const AVISO_ESTIMATIVA = "Valor estimado, sujeito a confirmação pelo administrador.";

export const QUANTIDADE_MAXIMA = 1_000_000;

export function situacaoPreco(preco: PrecoParaEstimativa, hoje: Date): SituacaoPreco {
  if (!preco.fornecedorAtivo) return "FORNECEDOR_INATIVO";
  if (!preco.ativo) return "INATIVO";
  if (preco.validadeEstimativa.getTime() < hoje.getTime()) return "VENCIDO";
  return "VIGENTE";
}

export function precoVigente(preco: PrecoParaEstimativa, hoje: Date): boolean {
  return situacaoPreco(preco, hoje) === "VIGENTE";
}

/** Escolhe, por fornecedor, a faixa aplicável à quantidade. Uso interno e na tela do ADMIN. */
export function faixasAplicaveis(precos: PrecoParaEstimativa[], quantidade: number, hoje: Date) {
  const porFornecedor = new Map<string, PrecoParaEstimativa>();
  for (const p of precos) {
    if (!precoVigente(p, hoje) || p.quantidadeMinima > quantidade) continue;
    const atual = porFornecedor.get(p.fornecedorId);
    if (
      !atual ||
      p.quantidadeMinima > atual.quantidadeMinima ||
      (p.quantidadeMinima === atual.quantidadeMinima && p.valorUnitarioCentavos < atual.valorUnitarioCentavos)
    ) {
      porFornecedor.set(p.fornecedorId, p);
    }
  }
  return [...porFornecedor.values()];
}

export function calcularEstimativa(params: {
  quantidade: number;
  precos: PrecoParaEstimativa[];
  hoje: Date;
  produtoAtivo?: boolean;
}): Estimativa {
  const { quantidade, precos, hoje, produtoAtivo = true } = params;

  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > QUANTIDADE_MAXIMA) {
    return { disponivel: false, quantidade, motivo: "QUANTIDADE_INVALIDA" };
  }
  if (!produtoAtivo) return { disponivel: false, quantidade, motivo: "PRODUTO_INATIVO" };

  const faixas = faixasAplicaveis(precos, quantidade, hoje);
  if (faixas.length === 0) {
    const minimos = precos.filter((p) => precoVigente(p, hoje)).map((p) => p.quantidadeMinima);
    return {
      disponivel: false,
      quantidade,
      motivo: "SEM_PRECO_APLICAVEL",
      quantidadeMinimaDisponivel: minimos.length ? Math.min(...minimos) : undefined,
    };
  }

  const unitarios = faixas.map((f) => f.valorUnitarioCentavos);
  const prazos = faixas.map((f) => f.prazoEntregaDias);
  const unitarioMinimoCentavos = Math.min(...unitarios);
  const unitarioMaximoCentavos = Math.max(...unitarios);

  return {
    disponivel: true,
    quantidade,
    totalMinimoCentavos: unitarioMinimoCentavos * quantidade,
    totalMaximoCentavos: unitarioMaximoCentavos * quantidade,
    unitarioMinimoCentavos,
    unitarioMaximoCentavos,
    prazoMinDias: Math.min(...prazos),
    prazoMaxDias: Math.max(...prazos),
    opcoes: faixas.length,
  };
}

export type FaixaReferencia = {
  unitarioMinimoCentavos: number;
  unitarioMaximoCentavos: number;
  /** Menor quantidade mínima entre os preços vigentes. */
  quantidadeMinima: number;
};

/** Faixa de valor unitário para o card do catálogo (S4): todos os preços vigentes, sem filtrar quantidade. */
export function faixaReferencia(
  precos: PrecoParaEstimativa[],
  hoje: Date,
  produtoAtivo = true,
): FaixaReferencia | null {
  if (!produtoAtivo) return null;
  const vigentes = precos.filter((p) => precoVigente(p, hoje));
  if (vigentes.length === 0) return null;
  const valores = vigentes.map((p) => p.valorUnitarioCentavos);
  return {
    unitarioMinimoCentavos: Math.min(...valores),
    unitarioMaximoCentavos: Math.max(...valores),
    quantidadeMinima: Math.min(...vigentes.map((p) => p.quantidadeMinima)),
  };
}

export type TotalEstimado = {
  totalMinimoCentavos: number;
  totalMaximoCentavos: number;
  /** Itens com estimativa (entram no total). */
  itensComPreco: number;
  /** Itens sem preço aplicável (exigem cotação formal; fora do total). */
  itensSemPreco: number;
};

/** Soma as estimativas de uma lista de itens. Itens sem preço não entram no total (S6). */
export function somarEstimativas(
  itens: { minimoCentavos: number | null; maximoCentavos: number | null }[],
): TotalEstimado {
  let totalMinimoCentavos = 0;
  let totalMaximoCentavos = 0;
  let itensComPreco = 0;
  for (const item of itens) {
    if (item.minimoCentavos === null || item.maximoCentavos === null) continue;
    totalMinimoCentavos += item.minimoCentavos;
    totalMaximoCentavos += item.maximoCentavos;
    itensComPreco++;
  }
  return { totalMinimoCentavos, totalMaximoCentavos, itensComPreco, itensSemPreco: itens.length - itensComPreco };
}
