import Link from "next/link";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { SeloStatus } from "@/components/solicitacao";
import { EstadoVazio, Titulo, estilos } from "@/components/ui";
import { codigoSolicitacao, formatarBRL, formatarData, formatarDataHora } from "@/lib/formatacao";
import { ROTULO_STATUS, type StatusSolicitacao } from "@/lib/regras/status";

export const metadata = { title: "Fila de solicitações · Catálogo de Brindes" };

const FILTROS: { valor: string; rotulo: string; status: StatusSolicitacao[] }[] = [
  { valor: "pendentes", rotulo: "Pendentes", status: ["ENVIADA", "EM_ANALISE"] },
  { valor: "ENVIADA", rotulo: ROTULO_STATUS.ENVIADA, status: ["ENVIADA"] },
  { valor: "EM_ANALISE", rotulo: ROTULO_STATUS.EM_ANALISE, status: ["EM_ANALISE"] },
  { valor: "APROVADA", rotulo: ROTULO_STATUS.APROVADA, status: ["APROVADA"] },
  { valor: "CANCELADA", rotulo: ROTULO_STATUS.CANCELADA, status: ["CANCELADA"] },
  { valor: "todas", rotulo: "Todas", status: ["ENVIADA", "EM_ANALISE", "APROVADA", "CANCELADA"] },
];

export default async function FilaSolicitacoes(props: PageProps<"/admin/solicitacoes">) {
  await exigirAdmin();
  const { status } = await props.searchParams;
  const filtro = FILTROS.find((f) => f.valor === status) ?? FILTROS[0];

  // Rascunhos são carrinhos pessoais e não aparecem na fila.
  const solicitacoes = await db.solicitacaoCotacao.findMany({
    where: { status: { in: filtro.status } },
    include: {
      solicitante: { select: { nome: true } },
      resposta: { select: { valorTotalFinalCentavos: true } },
      _count: { select: { itens: true } },
    },
    orderBy: filtro.valor === "pendentes" ? [{ enviadaEm: "asc" }] : [{ enviadaEm: "desc" }],
  });

  return (
    <>
      <Titulo>Fila de solicitações</Titulo>
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filtrar por status">
        {FILTROS.map((f) => (
          <Link
            key={f.valor}
            href={`/admin/solicitacoes?status=${f.valor}`}
            aria-current={f.valor === filtro.valor ? "page" : undefined}
            className={`rounded-pill border px-3.5 py-1 text-sm font-semibold transition-colors ${
              f.valor === filtro.valor ? "border-brand-navy bg-brand-navy text-on-brand" : "border-brand-gray bg-surface text-on-surface hover:border-brand-navy"
            }`}
          >
            {f.rotulo}
          </Link>
        ))}
      </nav>

      {solicitacoes.length === 0 ? (
        <EstadoVazio titulo="Nenhuma solicitação neste filtro." />
      ) : (
        <div className={`${estilos.cartao} overflow-x-auto`}>
          <table className={estilos.tabela}>
            <thead className="bg-surface-alt">
              <tr>
                <th className={estilos.th}>Solicitação</th>
                <th className={estilos.th}>Solicitante</th>
                <th className={estilos.th}>Enviada em</th>
                <th className={estilos.th}>Necessária em</th>
                <th className={estilos.th}>Itens</th>
                <th className={estilos.th}>Valor final</th>
                <th className={estilos.th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {solicitacoes.map((s) => (
                <tr key={s.id}>
                  <td className={estilos.td}>
                    <Link href={`/admin/solicitacoes/${s.id}`} className={`${estilos.link} tabular-nums`}>
                      {codigoSolicitacao(s.id)}
                    </Link>
                  </td>
                  <td className={estilos.td}>
                    {s.solicitante.nome}
                    <p className="text-xs text-on-surface-muted">{s.departamento}</p>
                  </td>
                  <td className={estilos.td}>{s.enviadaEm ? formatarDataHora(s.enviadaEm) : "—"}</td>
                  <td className={estilos.td}>{s.dataNecessaria ? formatarData(s.dataNecessaria) : "—"}</td>
                  <td className={estilos.td}>{s._count.itens}</td>
                  <td className={estilos.td}>{s.resposta ? formatarBRL(s.resposta.valorTotalFinalCentavos) : "—"}</td>
                  <td className={estilos.td}>
                    <SeloStatus status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
