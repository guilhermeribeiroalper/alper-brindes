import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { alterarAtivoPreco } from "@/actions/precos";
import { BotaoEnviar } from "@/components/botao-enviar";
import { HistoricoPreco } from "@/components/historico-preco";
import { Alerta, Selo, Titulo, estilos } from "@/components/ui";
import { dataCivilParaIso, hojeCivil, somarDias } from "@/lib/datas";
import { formatarBRL, formatarData } from "@/lib/formatacao";
import { situacaoPreco, type SituacaoPreco } from "@/lib/regras/estimativa";
import { fornecedoresParaPreco } from "./dados";
import { FormPreco } from "./form-preco";

export const metadata = { title: "Preços do produto · Catálogo de Brindes" };

const SELO_SITUACAO: Record<SituacaoPreco, { cor: "verde" | "amarelo" | "cinza" | "vermelho"; texto: string }> = {
  VIGENTE: { cor: "verde", texto: "Vigente" },
  VENCIDO: { cor: "amarelo", texto: "Vencido" },
  INATIVO: { cor: "cinza", texto: "Inativo" },
  FORNECEDOR_INATIVO: { cor: "vermelho", texto: "Fornecedor inativo" },
};

export default async function PrecosProduto(props: PageProps<"/admin/produtos/[id]/precos">) {
  await exigirAdmin();
  const { id } = await props.params;
  const hoje = hojeCivil();

  const [produto, fornecedores, historico] = await Promise.all([
    db.produto.findUnique({
      where: { id },
      include: {
        precos: {
          include: { fornecedor: { select: { nome: true, ativo: true } } },
          orderBy: [{ fornecedor: { nome: "asc" } }, { quantidadeMinima: "asc" }],
        },
      },
    }),
    fornecedoresParaPreco(),
    db.historicoPreco.findMany({
      where: { precoFornecedor: { produtoId: id } },
      include: {
        alteradoPor: { select: { nome: true } },
        precoFornecedor: { select: { quantidadeMinima: true, fornecedor: { select: { nome: true } } } },
      },
      orderBy: { alteradoEm: "desc" },
      take: 30,
    }),
  ]);
  if (!produto) notFound();

  return (
    <>
      <p className="mb-1 text-sm">
        <Link href="/admin/produtos" className={estilos.link}>
          Produtos
        </Link>{" "}
        /{" "}
        <Link href={`/admin/produtos/${produto.id}`} className={estilos.link}>
          {produto.nome}
        </Link>
      </p>
      <Titulo>Preços por fornecedor</Titulo>

      {!produto.ativo && (
        <div className="mb-4">
          <Alerta tipo="aviso">Produto inativo: os preços abaixo não são usados em estimativas.</Alerta>
        </div>
      )}

      {produto.precos.length === 0 ? (
        <div className="mb-6">
          <Alerta tipo="info">
            Nenhum preço cadastrado. Sem preço vigente, o solicitante verá &quot;Sob cotação&quot; e precisará pedir
            cotação formal.
          </Alerta>
        </div>
      ) : (
        <div className={`${estilos.cartao} mb-6 overflow-x-auto`}>
          <table className={estilos.tabela}>
            <thead className="bg-slate-50">
              <tr>
                <th className={estilos.th}>Fornecedor</th>
                <th className={estilos.th}>A partir de</th>
                <th className={estilos.th}>Valor unit.</th>
                <th className={estilos.th}>Prazo</th>
                <th className={estilos.th}>Válido até</th>
                <th className={estilos.th}>Situação</th>
                <th className={estilos.th}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {produto.precos.map((p) => {
                const situacao = situacaoPreco({ ...p, fornecedorAtivo: p.fornecedor.ativo }, hoje);
                return (
                  <tr key={p.id} className={situacao === "VIGENTE" ? "" : "text-slate-500"}>
                    <td className={estilos.td}>
                      {p.fornecedor.nome}
                      {p.observacoes && <p className="text-xs text-slate-500">{p.observacoes}</p>}
                    </td>
                    <td className={estilos.td}>{p.quantidadeMinima} un.</td>
                    <td className={`${estilos.td} font-medium`}>{formatarBRL(p.valorUnitarioCentavos)}</td>
                    <td className={estilos.td}>{p.prazoEntregaDias} dias</td>
                    <td className={estilos.td}>{formatarData(p.validadeEstimativa)}</td>
                    <td className={estilos.td}>
                      <Selo cor={SELO_SITUACAO[situacao].cor}>{SELO_SITUACAO[situacao].texto}</Selo>
                    </td>
                    <td className={`${estilos.td} whitespace-nowrap`}>
                      <div className="flex gap-2">
                        <Link href={`/admin/produtos/${produto.id}/precos/${p.id}`} className={estilos.botaoPequeno}>
                          Editar
                        </Link>
                        <form action={alterarAtivoPreco}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="ativo" value={String(!p.ativo)} />
                          <BotaoEnviar variante="botaoPequeno" pendente="…">
                            {p.ativo ? "Desativar" : "Ativar"}
                          </BotaoEnviar>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className={`${estilos.cartao} mb-8 p-6`}>
        <h2 className="mb-1 text-lg font-semibold">Adicionar faixa de preço</h2>
        <p className="mb-4 text-sm text-slate-500">
          Cadastre uma linha por faixa de quantidade. Ex.: R$ 18,90 a partir de 1 un. e R$ 14,90 a partir de 100 un.
        </p>
        <FormPreco
          produtoId={produto.id}
          fornecedores={fornecedores}
          validadePadrao={dataCivilParaIso(somarDias(hoje, 90))}
        />
      </section>

      <h2 className="mb-3 text-lg font-semibold">Histórico de alterações de preço</h2>
      <HistoricoPreco linhas={historico} />
    </>
  );
}
