import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { iniciarAnalise } from "@/actions/solicitacoes";
import { BotaoEnviar } from "@/components/botao-enviar";
import { ItensCongelados, SeloStatus } from "@/components/solicitacao";
import { Alerta, Titulo, estilos } from "@/components/ui";
import { hojeCivil } from "@/lib/datas";
import { codigoSolicitacao, formatarBRL, formatarData, formatarDataHora } from "@/lib/formatacao";
import { faixasAplicaveis } from "@/lib/regras/estimativa";
import { FormResposta } from "./form-resposta";

export const metadata = { title: "Solicitação (admin) · Catálogo de Brindes" };

export default async function DetalheSolicitacaoAdmin(props: PageProps<"/admin/solicitacoes/[id]">) {
  await exigirAdmin();
  const { id } = await props.params;
  const hoje = hojeCivil();

  const solicitacao = await db.solicitacaoCotacao.findUnique({
    where: { id },
    include: {
      solicitante: { select: { nome: true, email: true } },
      itens: {
        include: {
          produto: {
            select: {
              id: true,
              nome: true,
              ativo: true,
              precos: { include: { fornecedor: { select: { id: true, nome: true, ativo: true } } } },
            },
          },
        },
        orderBy: { produto: { nome: "asc" } },
      },
      resposta: {
        include: { admin: { select: { nome: true } }, fornecedorEscolhido: { select: { nome: true } } },
      },
    },
  });
  if (!solicitacao || solicitacao.status === "RASCUNHO") notFound();

  const fornecedores =
    solicitacao.status === "EM_ANALISE"
      ? await db.fornecedor.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } })
      : [];

  // Preços vigentes hoje, por fornecedor, para a quantidade de cada item (só o admin vê).
  const referencias = solicitacao.itens.map((item) => {
    const nomes = new Map(item.produto.precos.map((p) => [p.fornecedorId, p.fornecedor.nome]));
    const opcoes = faixasAplicaveis(
      item.produto.precos.map((p) => ({ ...p, fornecedorAtivo: p.fornecedor.ativo })),
      item.quantidade,
      hoje,
    ).sort((a, b) => a.valorUnitarioCentavos - b.valorUnitarioCentavos);
    return { item, opcoes: opcoes.map((o) => ({ ...o, fornecedor: nomes.get(o.fornecedorId) ?? "—" })) };
  });

  return (
    <>
      <p className="mb-1 text-sm">
        <Link href="/admin/solicitacoes" className={estilos.link}>
          ← Fila de solicitações
        </Link>
      </p>
      <Titulo
        acoes={
          solicitacao.status === "ENVIADA" && (
            <form action={iniciarAnalise}>
              <input type="hidden" name="id" value={solicitacao.id} />
              <BotaoEnviar pendente="Atualizando…">Iniciar análise</BotaoEnviar>
            </form>
          )
        }
      >
        Solicitação <span className="tabular-nums">{codigoSolicitacao(solicitacao.id)}</span>{" "}
        <SeloStatus status={solicitacao.status} />
      </Titulo>

      {solicitacao.status === "CANCELADA" && (
        <div className="mb-4">
          <Alerta tipo="aviso">
            Cancelada pelo solicitante{solicitacao.canceladaEm ? ` em ${formatarDataHora(solicitacao.canceladaEm)}` : ""}.
          </Alerta>
        </div>
      )}

      <dl className={`${estilos.cartao} mb-6 grid gap-4 p-5 text-sm sm:grid-cols-4`}>
        <div>
          <dt className="text-xs text-on-surface-muted">Solicitante</dt>
          <dd>
            {solicitacao.solicitante.nome}
            <span className="block text-xs text-on-surface-muted">{solicitacao.solicitante.email}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-muted">Departamento</dt>
          <dd>{solicitacao.departamento}</dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-muted">Enviada em</dt>
          <dd>{solicitacao.enviadaEm ? formatarDataHora(solicitacao.enviadaEm) : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-muted">Necessária em</dt>
          <dd>{solicitacao.dataNecessaria ? formatarData(solicitacao.dataNecessaria) : "—"}</dd>
        </div>
        {solicitacao.justificativa && (
          <div className="sm:col-span-4">
            <dt className="text-xs text-on-surface-muted">Justificativa</dt>
            <dd className="whitespace-pre-line">{solicitacao.justificativa}</dd>
          </div>
        )}
      </dl>

      <h2 className="mb-3 font-display text-xl font-semibold text-on-surface">Itens e estimativas congeladas no envio</h2>
      <ItensCongelados itens={solicitacao.itens} linkProduto={(produtoId) => `/admin/produtos/${produtoId}/precos`} />

      {solicitacao.status !== "CANCELADA" && solicitacao.status !== "RESPONDIDA" && (
        <>
          <h2 className="mb-3 mt-8 font-display text-xl font-semibold text-on-surface">Preços vigentes hoje por fornecedor</h2>
          <div className="space-y-3">
            {referencias.map(({ item, opcoes }) => (
              <div key={item.id} className={`${estilos.cartao} p-4`}>
                <p className="font-medium">
                  {item.produto.nome} <span className="font-normal text-on-surface-muted">· {item.quantidade.toLocaleString("pt-BR")} un.</span>
                </p>
                {opcoes.length === 0 ? (
                  <p className="mt-1 text-sm font-semibold text-on-surface">Nenhum preço vigente para esta quantidade.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-border text-sm">
                    {opcoes.map((o) => (
                      <li key={o.fornecedorId} className="flex flex-wrap justify-between gap-2 py-1.5">
                        <span>
                          {o.fornecedor}{" "}
                          <span className="text-xs text-on-surface-muted">
                            (faixa a partir de {o.quantidadeMinima} un., {o.prazoEntregaDias} dias)
                          </span>
                        </span>
                        <span className="tabular-nums">
                          {formatarBRL(o.valorUnitarioCentavos)}/un. ·{" "}
                          <strong>{formatarBRL(o.valorUnitarioCentavos * item.quantidade)}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {solicitacao.status === "ENVIADA" && (
        <div className="mt-8">
          <Alerta tipo="info">Clique em &quot;Iniciar análise&quot; para assumir a solicitação e registrar a resposta.</Alerta>
        </div>
      )}

      {solicitacao.status === "EM_ANALISE" && (
        <section className={`${estilos.cartao} mt-8 p-6`}>
          <h2 className="mb-4 font-display text-xl font-semibold text-on-surface">Registrar resposta</h2>
          <FormResposta solicitacaoId={solicitacao.id} fornecedores={fornecedores} />
        </section>
      )}

      {solicitacao.resposta && (
        <section className="mt-8 rounded-lg border border-success/50 bg-success/10 p-5">
          <h2 className="font-display text-xl font-semibold text-on-surface">Resposta registrada</h2>
          <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-on-surface">Valor total final</dt>
              <dd className="text-xl font-semibold">{formatarBRL(solicitacao.resposta.valorTotalFinalCentavos)}</dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface">Fornecedor escolhido</dt>
              <dd>{solicitacao.resposta.fornecedorEscolhido?.nome ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface">Prazo de entrega</dt>
              <dd>{solicitacao.resposta.prazoEntregaDias} dias</dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface">Respondida por</dt>
              <dd>
                {solicitacao.resposta.admin.nome}
                <span className="block text-xs">{formatarDataHora(solicitacao.resposta.respondidaEm)}</span>
              </dd>
            </div>
          </dl>
          {solicitacao.resposta.observacoes && (
            <p className="mt-3 whitespace-pre-line text-sm">{solicitacao.resposta.observacoes}</p>
          )}
        </section>
      )}
    </>
  );
}
