import Link from "next/link";
import { db } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth/guards";
import { FaixaTotal, SeloStatus } from "@/components/solicitacao";
import { EstadoVazio, Titulo, estilos } from "@/components/ui";
import { codigoSolicitacao, formatarBRL, formatarData, formatarDataHora } from "@/lib/formatacao";
import { somarEstimativas } from "@/lib/regras/estimativa";

export const metadata = { title: "Minhas solicitações · Catálogo de Brindes" };

export default async function MinhasSolicitacoes() {
  const usuario = await exigirUsuario();
  const solicitacoes = await db.solicitacaoCotacao.findMany({
    where: { solicitanteId: usuario.id, status: { not: "RASCUNHO" } },
    include: {
      itens: { select: { estimativaMinimaCentavos: true, estimativaMaximaCentavos: true } },
      resposta: { select: { valorTotalFinalCentavos: true } },
    },
    orderBy: { criadaEm: "desc" },
  });

  return (
    <>
      <Titulo
        acoes={
          <Link href="/minha-solicitacao" className={estilos.botaoSecundario}>
            Ir para minha solicitação atual
          </Link>
        }
      >
        Minhas solicitações
      </Titulo>

      {solicitacoes.length === 0 ? (
        <EstadoVazio titulo="Você ainda não enviou solicitações.">
          Monte sua lista no catálogo e envie a solicitação formal de cotação.
        </EstadoVazio>
      ) : (
        <div className={`${estilos.cartao} overflow-x-auto`}>
          <table className={estilos.tabela}>
            <thead className="bg-surface-alt">
              <tr>
                <th className={estilos.th}>Solicitação</th>
                <th className={estilos.th}>Enviada em</th>
                <th className={estilos.th}>Necessária em</th>
                <th className={estilos.th}>Itens</th>
                <th className={estilos.th}>Valor</th>
                <th className={estilos.th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {solicitacoes.map((s) => {
                const total = somarEstimativas(
                  s.itens.map((i) => ({ minimoCentavos: i.estimativaMinimaCentavos, maximoCentavos: i.estimativaMaximaCentavos })),
                );
                return (
                  <tr key={s.id}>
                    <td className={estilos.td}>
                      <Link href={`/solicitacoes/${s.id}`} className={`${estilos.link} tabular-nums`}>
                        {codigoSolicitacao(s.id)}
                      </Link>
                    </td>
                    <td className={estilos.td}>{s.enviadaEm ? formatarDataHora(s.enviadaEm) : "—"}</td>
                    <td className={estilos.td}>{s.dataNecessaria ? formatarData(s.dataNecessaria) : "—"}</td>
                    <td className={estilos.td}>{s.itens.length}</td>
                    <td className={estilos.td}>
                      {s.resposta ? (
                        <span className="font-medium">{formatarBRL(s.resposta.valorTotalFinalCentavos)}</span>
                      ) : total.itensComPreco > 0 ? (
                        <span className="text-on-surface">
                          Est. <FaixaTotal minimo={total.totalMinimoCentavos} maximo={total.totalMaximoCentavos} />
                        </span>
                      ) : (
                        <span className="text-on-surface-muted">Sob cotação</span>
                      )}
                    </td>
                    <td className={estilos.td}>
                      <SeloStatus status={s.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
