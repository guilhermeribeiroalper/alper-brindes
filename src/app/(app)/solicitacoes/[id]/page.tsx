import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth/guards";
import { ehDonoDaSolicitacao, podeVerSolicitacao } from "@/lib/auth/permissoes";
import { cancelarSolicitacao } from "@/actions/solicitacoes";
import { BotaoEnviar } from "@/components/botao-enviar";
import { ItensCongelados, SeloStatus } from "@/components/solicitacao";
import { Alerta, Titulo, estilos } from "@/components/ui";
import { codigoSolicitacao, formatarBRL, formatarData, formatarDataHora } from "@/lib/formatacao";
import { podeCancelar } from "@/lib/regras/status";

export const metadata = { title: "Solicitação · Catálogo de Brindes" };

export default async function DetalheSolicitacao(props: PageProps<"/solicitacoes/[id]">) {
  const usuario = await exigirUsuario();
  const { id } = await props.params;
  const { enviada } = await props.searchParams;

  // Visão do solicitante: a resposta é carregada SEM o fornecedor escolhido.
  const solicitacao = await db.solicitacaoCotacao.findUnique({
    where: { id },
    include: {
      itens: {
        include: { produto: { select: { id: true, nome: true, ativo: true } } },
        orderBy: { produto: { nome: "asc" } },
      },
      resposta: { select: { valorTotalFinalCentavos: true, prazoEntregaDias: true, observacoes: true, respondidaEm: true } },
    },
  });
  // Não revela se a solicitação existe quando ela é de outra pessoa.
  if (!solicitacao || !podeVerSolicitacao(usuario, solicitacao)) notFound();
  if (solicitacao.status === "RASCUNHO") redirect("/minha-solicitacao");

  const dono = ehDonoDaSolicitacao(usuario, solicitacao);

  return (
    <>
      <p className="mb-1 text-sm">
        <Link href="/solicitacoes" className={estilos.link}>
          ← Minhas solicitações
        </Link>
      </p>
      <Titulo
        acoes={
          dono &&
          podeCancelar(solicitacao.status) && (
            <form action={cancelarSolicitacao}>
              <input type="hidden" name="id" value={solicitacao.id} />
              <BotaoEnviar variante="botaoPerigo" pendente="Cancelando…">
                Cancelar solicitação
              </BotaoEnviar>
            </form>
          )
        }
      >
        Solicitação <span className="tabular-nums">{codigoSolicitacao(solicitacao.id)}</span>{" "}
        <SeloStatus status={solicitacao.status} />
      </Titulo>

      {enviada && solicitacao.status === "ENVIADA" && (
        <div className="mb-4">
          <Alerta tipo="sucesso">Solicitação enviada. O administrador vai analisar e decidir por aqui.</Alerta>
        </div>
      )}

      {solicitacao.status === "CANCELADA" && (
        <div className="mb-6">
          <Alerta tipo="aviso">
            {solicitacao.canceladaPorId && solicitacao.canceladaPorId !== solicitacao.solicitanteId
              ? "Solicitação cancelada pelo administrador"
              : "Solicitação cancelada"}
            {solicitacao.canceladaEm ? ` em ${formatarDataHora(solicitacao.canceladaEm)}` : ""}.
            {solicitacao.motivoCancelamento && (
              <span className="mt-1 block whitespace-pre-line">Motivo: {solicitacao.motivoCancelamento}</span>
            )}
          </Alerta>
        </div>
      )}

      {solicitacao.resposta && (
        <section className="mb-6 rounded-lg border border-success/50 bg-success/10 p-5">
          <h2 className="font-display text-xl font-semibold text-on-surface">Solicitação aprovada</h2>
          <dl className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-on-surface">Valor total final</dt>
              <dd className="text-2xl font-semibold text-on-surface">{formatarBRL(solicitacao.resposta.valorTotalFinalCentavos)}</dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface">Prazo de entrega</dt>
              <dd className="text-lg">{solicitacao.resposta.prazoEntregaDias} dias</dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface">Aprovada em</dt>
              <dd className="text-lg">{formatarDataHora(solicitacao.resposta.respondidaEm)}</dd>
            </div>
          </dl>
          {solicitacao.resposta.observacoes && (
            <p className="mt-3 whitespace-pre-line text-sm text-on-surface">{solicitacao.resposta.observacoes}</p>
          )}
        </section>
      )}

      <dl className={`${estilos.cartao} mb-6 grid gap-4 p-5 text-sm sm:grid-cols-4`}>
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
        <div>
          <dt className="text-xs text-on-surface-muted">Última atualização</dt>
          <dd>{formatarDataHora(solicitacao.atualizadaEm)}</dd>
        </div>
        {solicitacao.justificativa && (
          <div className="sm:col-span-4">
            <dt className="text-xs text-on-surface-muted">Justificativa</dt>
            <dd className="whitespace-pre-line">{solicitacao.justificativa}</dd>
          </div>
        )}
      </dl>

      <h2 className="mb-3 font-display text-xl font-semibold text-on-surface">Itens</h2>
      <ItensCongelados itens={solicitacao.itens} />
    </>
  );
}
