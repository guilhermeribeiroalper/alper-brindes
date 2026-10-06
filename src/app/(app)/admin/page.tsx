import Link from "next/link";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { SeloStatus } from "@/components/solicitacao";
import { EstadoVazio, Titulo, estilos } from "@/components/ui";
import { hojeCivil, somarDias } from "@/lib/datas";
import { codigoSolicitacao, formatarData, formatarDataHora } from "@/lib/formatacao";

export const metadata = { title: "Painel · Catálogo de Brindes" };

function Indicador({ rotulo, valor, href, destaque }: { rotulo: string; valor: number; href: string; destaque?: boolean }) {
  return (
    <Link href={href} className={`${estilos.cartao} block p-4 hover:border-marca-600`}>
      <p className="text-sm text-slate-500">{rotulo}</p>
      <p className={`mt-1 text-3xl font-semibold ${destaque && valor > 0 ? "text-marca-700" : "text-slate-900"}`}>{valor}</p>
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

      <h2 className="mb-3 text-lg font-semibold">Solicitações pendentes</h2>
      {pendentes.length === 0 ? (
        <EstadoVazio titulo="Nenhuma solicitação pendente.">Tudo em dia.</EstadoVazio>
      ) : (
        <div className={`${estilos.cartao} overflow-x-auto`}>
          <table className={estilos.tabela}>
            <thead className="bg-slate-50">
              <tr>
                <th className={estilos.th}>Solicitação</th>
                <th className={estilos.th}>Solicitante</th>
                <th className={estilos.th}>Necessária em</th>
                <th className={estilos.th}>Enviada em</th>
                <th className={estilos.th}>Itens</th>
                <th className={estilos.th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendentes.map((s) => {
                const urgente = s.dataNecessaria && s.dataNecessaria <= emSeteDias;
                return (
                  <tr key={s.id}>
                    <td className={estilos.td}>
                      <Link href={`/admin/solicitacoes/${s.id}`} className={`${estilos.link} font-mono`}>
                        {codigoSolicitacao(s.id)}
                      </Link>
                    </td>
                    <td className={estilos.td}>
                      {s.solicitante.nome}
                      <p className="text-xs text-slate-500">{s.departamento}</p>
                    </td>
                    <td className={`${estilos.td} ${urgente ? "font-semibold text-red-700" : ""}`}>
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
