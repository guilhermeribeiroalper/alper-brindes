import Link from "next/link";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { SeloStatus } from "@/components/solicitacao";
import { EstadoVazio, Titulo, estilos } from "@/components/ui";
import { hojeCivil, somarDias } from "@/lib/datas";
import { codigoSolicitacao, formatarData, formatarDataHora } from "@/lib/formatacao";

export const metadata = { title: "Painel · Catálogo de Brindes" };

function Indicador({ rotulo, valor, href, destaque }: { rotulo: string; valor: number; href: string; destaque?: boolean }) {
  // Pendência com valor: card na cor da marca, com grafismo.
  const marca = destaque && valor > 0;
  return (
    <Link
      href={href}
      className={
        marca
          ? "sobre-marca relative block overflow-hidden rounded-md bg-surface-brand p-5 text-on-brand shadow-md"
          : `${estilos.cartao} block p-5 transition hover:border-brand-navy hover:shadow-md`
      }
    >
      {marca && <div className="grafismo pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-60" aria-hidden />}
      <p className={`relative text-sm font-semibold ${marca ? "text-on-brand/85" : "text-on-surface-muted"}`}>{rotulo}</p>
      <p className="relative mt-2 font-display text-4xl leading-none font-bold">{valor}</p>
    </Link>
  );
}

export default async function PainelAdmin() {
  await exigirAdmin();
  const hoje = hojeCivil();
  const emSeteDias = somarDias(hoje, 7);

  const [enviadas, emAnalise, pendentes, precosVencidos, produtosSemPreco] = await Promise.all([
    db.solicitacaoCotacao.count({ where: { status: "ENVIADA" } }),
    db.solicitacaoCotacao.count({ where: { status: "EM_ANALISE" } }),
    db.solicitacaoCotacao.findMany({
      where: { status: { in: ["ENVIADA", "EM_ANALISE"] } },
      include: { solicitante: { select: { nome: true } }, _count: { select: { itens: true } } },
      orderBy: [{ dataNecessaria: "asc" }, { enviadaEm: "asc" }],
      take: 20,
    }),
    db.precoFornecedor.count({ where: { ativo: true, validadeEstimativa: { lt: hoje } } }),
    db.produto.count({
      where: {
        ativo: true,
        precos: { none: { ativo: true, validadeEstimativa: { gte: hoje }, fornecedor: { ativo: true } } },
      },
    }),
  ]);

  return (
    <>
      <Titulo>Painel</Titulo>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Indicador rotulo="Aguardando análise" valor={enviadas} href="/admin/solicitacoes?status=ENVIADA" destaque />
        <Indicador rotulo="Em análise" valor={emAnalise} href="/admin/solicitacoes?status=EM_ANALISE" />
        <Indicador rotulo="Preços vencidos" valor={precosVencidos} href="/admin/produtos" />
        <Indicador rotulo="Produtos sem preço vigente" valor={produtosSemPreco} href="/admin/produtos" />
      </div>

      <h2 className="mb-3 font-display text-xl font-semibold text-on-surface">Solicitações pendentes</h2>
      {pendentes.length === 0 ? (
        <EstadoVazio titulo="Nenhuma solicitação pendente.">Tudo em dia.</EstadoVazio>
      ) : (
        <div className={`${estilos.cartao} overflow-x-auto`}>
          <table className={estilos.tabela}>
            <thead className="bg-surface-alt">
              <tr>
                <th className={estilos.th}>Solicitação</th>
                <th className={estilos.th}>Solicitante</th>
                <th className={estilos.th}>Necessária em</th>
                <th className={estilos.th}>Enviada em</th>
                <th className={estilos.th}>Itens</th>
                <th className={estilos.th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pendentes.map((s) => {
                const urgente = s.dataNecessaria && s.dataNecessaria <= emSeteDias;
                return (
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
                    <td className={`${estilos.td} ${urgente ? "font-semibold text-error" : ""}`}>
                      {s.dataNecessaria ? formatarData(s.dataNecessaria) : "—"}
                      {urgente && <span className="block text-xs font-normal">em até 7 dias</span>}
                    </td>
                    <td className={estilos.td}>{s.enviadaEm ? formatarDataHora(s.enviadaEm) : "—"}</td>
                    <td className={estilos.td}>{s._count.itens}</td>
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
