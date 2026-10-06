import { formatarBRL, formatarDataHora } from "@/lib/formatacao";
import { estilos } from "@/components/ui";

export type LinhaHistorico = {
  id: string;
  valorAnteriorCentavos: number | null;
  valorNovoCentavos: number;
  alteradoEm: Date;
  alteradoPor: { nome: string };
  precoFornecedor?: { quantidadeMinima: number; fornecedor: { nome: string } };
};

export function HistoricoPreco({ linhas }: { linhas: LinhaHistorico[] }) {
  if (linhas.length === 0) return <p className="text-sm text-slate-500">Nenhuma alteração registrada.</p>;
  const mostrarPreco = linhas.some((l) => l.precoFornecedor);

  return (
    <div className={`${estilos.cartao} overflow-x-auto`}>
      <table className={estilos.tabela}>
        <thead className="bg-slate-50">
          <tr>
            <th className={estilos.th}>Quando</th>
            {mostrarPreco && <th className={estilos.th}>Faixa</th>}
            <th className={estilos.th}>Valor anterior</th>
            <th className={estilos.th}>Novo valor</th>
            <th className={estilos.th}>Alterado por</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {linhas.map((l) => (
            <tr key={l.id}>
              <td className={`${estilos.td} whitespace-nowrap`}>{formatarDataHora(l.alteradoEm)}</td>
              {mostrarPreco && (
                <td className={estilos.td}>
                  {l.precoFornecedor
                    ? `${l.precoFornecedor.fornecedor.nome} · a partir de ${l.precoFornecedor.quantidadeMinima} un.`
                    : "—"}
                </td>
              )}
              <td className={estilos.td}>
                {l.valorAnteriorCentavos === null ? <span className="text-slate-500">Cadastro inicial</span> : formatarBRL(l.valorAnteriorCentavos)}
              </td>
              <td className={`${estilos.td} font-medium`}>{formatarBRL(l.valorNovoCentavos)}</td>
              <td className={estilos.td}>{l.alteradoPor.nome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
