import "server-only";
import { db } from "@/lib/db";
import { hojeCivil } from "@/lib/datas";
import { normalizarBusca } from "@/lib/formatacao";
import {
  calcularEstimativa,
  faixaReferencia,
  type Estimativa,
  type FaixaReferencia,
  type PrecoParaEstimativa,
} from "@/lib/regras/estimativa";

// Consultas da "visão solicitante". NUNCA devolvem fornecedores nem valores por fornecedor:
// os preços são carregados aqui, agregados e só a faixa/estimativa sai deste módulo.

const SELECT_PRECO = {
  fornecedorId: true,
  valorUnitarioCentavos: true,
  quantidadeMinima: true,
  prazoEntregaDias: true,
  validadeEstimativa: true,
  ativo: true,
  fornecedor: { select: { ativo: true } },
} as const;

type PrecoDoBanco = {
  fornecedorId: string;
  valorUnitarioCentavos: number;
  quantidadeMinima: number;
  prazoEntregaDias: number;
  validadeEstimativa: Date;
  ativo: boolean;
  fornecedor: { ativo: boolean };
};

function paraEstimativa(precos: PrecoDoBanco[]): PrecoParaEstimativa[] {
  return precos.map(({ fornecedor, ...p }) => ({ ...p, fornecedorAtivo: fornecedor.ativo }));
}

export type ProdutoCatalogo = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  imagemUrl: string | null;
  faixa: FaixaReferencia | null;
};

export async function listarCatalogo(filtro: { busca?: string; categoria?: string }) {
  const hoje = hojeCivil();
  const produtos = await db.produto.findMany({
    where: { ativo: true },
    select: {
      id: true,
      nome: true,
      descricao: true,
      categoria: true,
      imagemUrl: true,
      precos: { select: SELECT_PRECO },
    },
    orderBy: { nome: "asc" },
  });

  const categorias = [...new Set(produtos.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const termo = normalizarBusca(filtro.busca ?? "");

  const itens: ProdutoCatalogo[] = produtos
    .filter((p) => !filtro.categoria || p.categoria === filtro.categoria)
    .filter((p) => !termo || normalizarBusca(`${p.nome} ${p.descricao ?? ""} ${p.categoria}`).includes(termo))
    .map(({ precos, ...p }) => ({ ...p, faixa: faixaReferencia(paraEstimativa(precos), hoje) }));

  return { itens, categorias };
}

/** Produto ativo para a página de detalhe, ou null se não existir ou estiver inativo. */
export async function obterProdutoCatalogo(id: string): Promise<ProdutoCatalogo | null> {
  const produto = await db.produto.findFirst({
    where: { id, ativo: true },
    select: {
      id: true,
      nome: true,
      descricao: true,
      categoria: true,
      imagemUrl: true,
      precos: { select: SELECT_PRECO },
    },
  });
  if (!produto) return null;
  const { precos, ...resto } = produto;
  return { ...resto, faixa: faixaReferencia(paraEstimativa(precos), hojeCivil()) };
}

/** Estimativa para um produto e quantidade, considerando só preços vigentes. */
export async function estimarProduto(produtoId: string, quantidade: number): Promise<Estimativa> {
  const produto = await db.produto.findUnique({
    where: { id: produtoId },
    select: { ativo: true, precos: { select: SELECT_PRECO } },
  });
  return calcularEstimativa({
    quantidade,
    precos: produto ? paraEstimativa(produto.precos) : [],
    hoje: hojeCivil(),
    produtoAtivo: produto?.ativo ?? false,
  });
}

/** Estimativas de vários produtos de uma vez (carrinho). */
export async function estimarItens(itens: { produtoId: string; quantidade: number }[]) {
  const produtos = await db.produto.findMany({
    where: { id: { in: itens.map((i) => i.produtoId) } },
    select: { id: true, ativo: true, precos: { select: SELECT_PRECO } },
  });
  const porId = new Map(produtos.map((p) => [p.id, p]));
  const hoje = hojeCivil();
  return new Map(
    itens.map((i) => {
      const p = porId.get(i.produtoId);
      return [
        i.produtoId,
        calcularEstimativa({
          quantidade: i.quantidade,
          precos: p ? paraEstimativa(p.precos) : [],
          hoje,
          produtoAtivo: p?.ativo ?? false,
        }),
      ];
    }),
  );
}
