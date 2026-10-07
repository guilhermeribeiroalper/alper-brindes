import { Selo } from "@/components/ui";
import { formatarBRL, formatarPrazo } from "@/lib/formatacao";
import { AVISO_ESTIMATIVA, type Estimativa, type FaixaReferencia } from "@/lib/regras/estimativa";

function faixaBRL(min: number, max: number) {
  return min === max ? formatarBRL(min) : `${formatarBRL(min)} a ${formatarBRL(max)}`;
}

/** Faixa de referência por unidade, usada nos cards do catálogo. */
export function FaixaPrecoReferencia({ faixa }: { faixa: FaixaReferencia | null }) {
  if (!faixa) return <Selo cor="amarelo">Sob cotação</Selo>;
  return (
    <div>
      <p className="text-base font-bold text-on-surface">
        {faixaBRL(faixa.unitarioMinimoCentavos, faixa.unitarioMaximoCentavos)}
        <span className="text-sm font-normal text-on-surface-muted"> /un.</span>
      </p>
      {faixa.quantidadeMinima > 1 && (
        <p className="text-xs text-on-surface-muted">Referência a partir de {faixa.quantidadeMinima} un.</p>
      )}
    </div>
  );
}

export function AvisoEstimativa() {
  return <p className="text-xs text-on-surface-muted">{AVISO_ESTIMATIVA}</p>;
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
      <div className="rounded-md border border-warning/60 bg-warning/10 p-4 text-sm text-on-surface" role="status">
        <p className="font-semibold">{mensagens[estimativa.motivo]}</p>
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
    <div
      className="sobre-marca relative overflow-hidden rounded-lg bg-surface-brand p-5 text-on-brand shadow-md"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <p className="text-xs font-semibold tracking-wide text-on-brand/80 uppercase">
          Estimativa para {estimativa.quantidade.toLocaleString("pt-BR")} un.
        </p>
        <p className="mt-1 font-display text-[28px] leading-[1.2] font-bold">
          {faixaBRL(estimativa.totalMinimoCentavos, estimativa.totalMaximoCentavos)}
        </p>
        <span className="mt-2 block h-1 w-10 rounded-pill bg-accent" aria-hidden />
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-on-brand/75">Por unidade</dt>
            <dd className="font-semibold">{faixaBRL(estimativa.unitarioMinimoCentavos, estimativa.unitarioMaximoCentavos)}</dd>
          </div>
          <div>
            <dt className="text-xs text-on-brand/75">Prazo de entrega</dt>
            <dd className="font-semibold">{formatarPrazo(estimativa.prazoMinDias, estimativa.prazoMaxDias)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-on-brand/80">{AVISO_ESTIMATIVA}</p>
      </div>
    </div>
  );
}
