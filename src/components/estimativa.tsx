import { formatarBRL, formatarPrazo } from "@/lib/formatacao";
import { AVISO_ESTIMATIVA, type Estimativa, type FaixaReferencia } from "@/lib/regras/estimativa";

function faixaBRL(min: number, max: number) {
  return min === max ? formatarBRL(min) : `${formatarBRL(min)} a ${formatarBRL(max)}`;
}

/** Faixa de referência por unidade, usada nos cards do catálogo. */
export function FaixaPrecoReferencia({ faixa }: { faixa: FaixaReferencia | null }) {
  if (!faixa) return <p className="text-sm font-medium text-amber-700">Sob cotação</p>;
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">
        {faixaBRL(faixa.unitarioMinimoCentavos, faixa.unitarioMaximoCentavos)}
        <span className="font-normal text-slate-500"> /un.</span>
      </p>
      {faixa.quantidadeMinima > 1 && (
        <p className="text-xs text-slate-500">Referência a partir de {faixa.quantidadeMinima} un.</p>
      )}
    </div>
  );
}

export function AvisoEstimativa() {
  return <p className="text-xs text-slate-500">{AVISO_ESTIMATIVA}</p>;
}

/** Resultado do simulador. Mostra só a faixa agregada (nunca fornecedores). */
export function ResultadoEstimativa({ estimativa }: { estimativa: Estimativa }) {
  if (!estimativa.disponivel) {
    const mensagens = {
      QUANTIDADE_INVALIDA: "Informe uma quantidade inteira a partir de 1.",
      PRODUTO_INATIVO: "Este produto não está mais disponível para estimativa.",
      SEM_PRECO_APLICAVEL: "Não há preço de referência para esta quantidade. É necessário solicitar cotação formal.",
    };
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
        <p className="font-medium">{mensagens[estimativa.motivo]}</p>
        {estimativa.motivo === "SEM_PRECO_APLICAVEL" && estimativa.quantidadeMinimaDisponivel && (
          <p className="mt-1">Há preço de referência a partir de {estimativa.quantidadeMinimaDisponivel} unidades.</p>
        )}
        {estimativa.motivo === "SEM_PRECO_APLICAVEL" && (
          <p className="mt-1">Você pode adicionar o item mesmo assim; o administrador fará a cotação.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-marca-100 bg-marca-50 p-4" role="status" aria-live="polite">
      <p className="text-xs font-medium uppercase tracking-wide text-marca-700">
        Estimativa para {estimativa.quantidade.toLocaleString("pt-BR")} un.
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {faixaBRL(estimativa.totalMinimoCentavos, estimativa.totalMaximoCentavos)}
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-700">
        <div>
          <dt className="text-xs text-slate-500">Por unidade</dt>
          <dd>{faixaBRL(estimativa.unitarioMinimoCentavos, estimativa.unitarioMaximoCentavos)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Prazo de entrega</dt>
          <dd>{formatarPrazo(estimativa.prazoMinDias, estimativa.prazoMaxDias)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-slate-600">{AVISO_ESTIMATIVA}</p>
    </div>
  );
}
