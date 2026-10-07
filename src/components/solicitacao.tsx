import Link from "next/link";
import { Selo, estilos } from "@/components/ui";
import { AvisoEstimativa } from "@/components/estimativa";
import { formatarBRL, formatarPrazo } from "@/lib/formatacao";
import { somarEstimativas } from "@/lib/regras/estimativa";
import { ROTULO_STATUS, type StatusSolicitacao } from "@/lib/regras/status";

const COR_STATUS = {
  RASCUNHO: "cinza",
  ENVIADA: "azul",
  EM_ANALISE: "amarelo",
  APROVADA: "verde",
  CANCELADA: "vermelho",
} as const;

export function SeloStatus({ status }: { status: StatusSolicitacao }) {
  return <Selo cor={COR_STATUS[status]}>{ROTULO_STATUS[status]}</Selo>;
}

export function FaixaTotal({ minimo, maximo }: { minimo: number; maximo: number }) {
  return <>{minimo === maximo ? formatarBRL(minimo) : `${formatarBRL(minimo)} a ${formatarBRL(maximo)}`}</>;
}

export type ItemCongelado = {
  id: string;
  quantidade: number;
  estimativaMinimaCentavos: number | null;
  estimativaMaximaCentavos: number | null;
  prazoMinDias: number | null;
  prazoMaxDias: number | null;
  produto: { id: string; nome: string; ativo: boolean };
};

/** Itens de uma solicitação enviada, com as estimativas congeladas no envio. */
export function ItensCongelados({ itens, linkProduto }: { itens: ItemCongelado[]; linkProduto?: (id: string) => string }) {
  const total = somarEstimativas(
    itens.map((i) => ({ minimoCentavos: i.estimativaMinimaCentavos, maximoCentavos: i.estimativaMaximaCentavos })),
  );
  return (
    <div className={`${estilos.cartao} overflow-x-auto`}>
      <table className={estilos.tabela}>
        <thead className="bg-surface-alt">
          <tr>
            <th className={estilos.th}>Produto</th>
            <th className={`${estilos.th} text-right`}>Qtd.</th>
            <th className={estilos.th}>Estimativa no envio</th>
            <th className={estilos.th}>Prazo estimado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {itens.map((i) => (
            <tr key={i.id}>
              <td className={estilos.td}>
                {linkProduto ? (
                  <Link href={linkProduto(i.produto.id)} className={estilos.link}>
                    {i.produto.nome}
                  </Link>
                ) : (
                  i.produto.nome
                )}
                {!i.produto.ativo && <span className="ml-2 text-xs text-on-surface-muted">(fora do catálogo)</span>}
              </td>
              <td className={`${estilos.td} text-right tabular-nums`}>{i.quantidade.toLocaleString("pt-BR")}</td>
              <td className={estilos.td}>
                {i.estimativaMinimaCentavos !== null && i.estimativaMaximaCentavos !== null ? (
                  <FaixaTotal minimo={i.estimativaMinimaCentavos} maximo={i.estimativaMaximaCentavos} />
                ) : (
                  <span className="font-semibold text-on-surface">Requer cotação formal</span>
                )}
              </td>
              <td className={estilos.td}>
                {i.prazoMinDias !== null && i.prazoMaxDias !== null ? formatarPrazo(i.prazoMinDias, i.prazoMaxDias) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-surface-alt">
          <tr>
            <td className={`${estilos.td} font-semibold`} colSpan={2}>
              Total estimado
            </td>
            <td className={`${estilos.td} font-semibold`} colSpan={2}>
              {total.itensComPreco > 0 ? (
                <FaixaTotal minimo={total.totalMinimoCentavos} maximo={total.totalMaximoCentavos} />
              ) : (
                "—"
              )}
              {total.itensSemPreco > 0 && (
                <span className="block text-xs font-normal text-on-surface-muted">
                  {total.itensSemPreco === 1
                    ? "1 item sem preço de referência não entra no total."
                    : `${total.itensSemPreco} itens sem preço de referência não entram no total.`}
                </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
      <div className="px-3 py-2">
        <AvisoEstimativa />
      </div>
    </div>
  );
}
