import Link from "next/link";
import { db } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth/guards";
import { estimarItens } from "@/lib/consultas/catalogo";
import { obterRascunho } from "@/lib/consultas/solicitacoes";
import { alterarQuantidadeItem, removerItem } from "@/actions/carrinho";
import { cancelarSolicitacao } from "@/actions/solicitacoes";
import { BotaoEnviar } from "@/components/botao-enviar";
import { AvisoEstimativa } from "@/components/estimativa";
import { FaixaTotal } from "@/components/solicitacao";
import { Alerta, EstadoVazio, Titulo, estilos } from "@/components/ui";
import { dataCivilParaIso, hojeCivil } from "@/lib/datas";
import { formatarPrazo } from "@/lib/formatacao";
import { somarEstimativas } from "@/lib/regras/estimativa";
import { FormEnvio } from "./form-envio";

export const metadata = { title: "Minha solicitação · Catálogo de Brindes" };

export default async function MinhaSolicitacao() {
  const usuario = await exigirUsuario();
  const rascunho = await obterRascunho(usuario.id);
  const itens = rascunho
    ? await db.itemSolicitacao.findMany({
        where: { solicitacaoId: rascunho.id },
        include: { produto: { select: { id: true, nome: true, categoria: true, ativo: true } } },
        orderBy: { produto: { nome: "asc" } },
      })
    : [];

  if (!rascunho || itens.length === 0) {
    return (
      <>
        <Titulo>Minha solicitação</Titulo>
        <EstadoVazio titulo="Sua solicitação está vazia.">
          <p>Escolha brindes no catálogo, simule a quantidade e clique em &quot;Adicionar à solicitação&quot;.</p>
          <Link href="/catalogo" className={`${estilos.botao} mt-4`}>
            Ir para o catálogo
          </Link>
        </EstadoVazio>
      </>
    );
  }

  // Estimativa atual (ainda não congelada) de cada item.
  const estimativas = await estimarItens(itens);
  const linhas = itens.map((item) => ({ item, estimativa: estimativas.get(item.produtoId)! }));
  const total = somarEstimativas(
    linhas.map(({ estimativa: e }) => ({
      minimoCentavos: e.disponivel ? e.totalMinimoCentavos : null,
      maximoCentavos: e.disponivel ? e.totalMaximoCentavos : null,
    })),
  );
  const temIndisponivel = itens.some((i) => !i.produto.ativo);

  return (
    <>
      <Titulo
        acoes={
          <form action={cancelarSolicitacao}>
            <input type="hidden" name="id" value={rascunho.id} />
            <BotaoEnviar variante="botaoPerigo" pendente="Descartando…">
              Descartar rascunho
            </BotaoEnviar>
          </form>
        }
      >
        Minha solicitação
      </Titulo>

      {temIndisponivel && (
        <div className="mb-4">
          <Alerta tipo="aviso">Há itens que saíram do catálogo. Remova-os para poder enviar a solicitação.</Alerta>
        </div>
      )}

      <ul className="space-y-3">
        {linhas.map(({ item, estimativa }) => (
          <li key={item.id} className={`${estilos.cartao} flex flex-col gap-3 p-4 sm:flex-row sm:items-center`}>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-on-surface-muted">{item.produto.categoria}</p>
              {item.produto.ativo ? (
                <Link href={`/catalogo/${item.produto.id}`} className="font-medium text-on-surface hover:underline">
                  {item.produto.nome}
                </Link>
              ) : (
                <p className="font-medium text-on-surface-muted">
                  {item.produto.nome} <span className="text-xs">(indisponível)</span>
                </p>
              )}
              <p className="mt-1 text-sm">
                {estimativa.disponivel ? (
                  <>
                    <span className="font-semibold">
                      <FaixaTotal minimo={estimativa.totalMinimoCentavos} maximo={estimativa.totalMaximoCentavos} />
                    </span>
                    <span className="text-on-surface-muted"> · prazo {formatarPrazo(estimativa.prazoMinDias, estimativa.prazoMaxDias)}</span>
                  </>
                ) : (
                  <span className="font-semibold text-on-surface">
                    {estimativa.motivo === "PRODUTO_INATIVO" ? "Produto indisponível" : "Sem preço de referência: requer cotação formal"}
                    {estimativa.motivo === "SEM_PRECO_APLICAVEL" && estimativa.quantidadeMinimaDisponivel
                      ? ` (há referência a partir de ${estimativa.quantidadeMinimaDisponivel} un.)`
                      : ""}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-end gap-2">
              <form action={alterarQuantidadeItem} className="flex items-end gap-2">
                <input type="hidden" name="itemId" value={item.id} />
                <div>
                  <label htmlFor={`qtd-${item.id}`} className="block text-xs text-on-surface-muted">
                    Quantidade
                  </label>
                  <input
                    id={`qtd-${item.id}`}
                    name="quantidade"
                    type="number"
                    min={1}
                    step={1}
                    required
                    defaultValue={item.quantidade}
                    className={`${estilos.input} w-28`}
                  />
                </div>
                <BotaoEnviar variante="botaoSecundario" pendente="…">
                  Atualizar
                </BotaoEnviar>
              </form>
              <form action={removerItem}>
                <input type="hidden" name="itemId" value={item.id} />
                <BotaoEnviar variante="botaoPerigo" pendente="…">
                  Remover
                </BotaoEnviar>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <div className={`${estilos.cartao} mt-4 p-4`}>
        <p className="text-sm text-on-surface-muted">Total estimado da lista</p>
        <p className="text-2xl font-semibold">
          {total.itensComPreco > 0 ? <FaixaTotal minimo={total.totalMinimoCentavos} maximo={total.totalMaximoCentavos} /> : "—"}
        </p>
        {total.itensSemPreco > 0 && (
          <p className="mt-1 text-sm font-semibold text-on-surface">
            {total.itensSemPreco === 1 ? "1 item" : `${total.itensSemPreco} itens`} sem preço de referência{" "}
            {total.itensSemPreco === 1 ? "não entra" : "não entram"} no total; o administrador fará a cotação.
          </p>
        )}
        <div className="mt-2">
          <AvisoEstimativa />
        </div>
      </div>

      <section className={`${estilos.cartao} mt-6 p-6`}>
        <h2 className="font-display text-xl font-semibold text-on-surface">Enviar solicitação formal de cotação</h2>
        <p className="mb-4 mt-1 text-sm text-on-surface-muted">
          Ao enviar, as estimativas acima ficam registradas e o administrador recebe o pedido.
        </p>
        <FormEnvio
          departamentoPadrao={rascunho.departamento || usuario.departamento}
          dataMinima={dataCivilParaIso(hojeCivil())}
          bloqueado={temIndisponivel}
        />
      </section>
    </>
  );
}
