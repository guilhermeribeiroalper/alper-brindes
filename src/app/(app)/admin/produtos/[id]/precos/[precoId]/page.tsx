import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { HistoricoPreco } from "@/components/historico-preco";
import { Titulo, estilos } from "@/components/ui";
import { dataCivilParaIso } from "@/lib/datas";
import { centavosParaTexto } from "@/lib/formatacao";
import { fornecedoresParaPreco } from "../dados";
import { FormPreco } from "../form-preco";

export const metadata = { title: "Editar preço · Catálogo de Brindes" };

export default async function EditarPreco(props: PageProps<"/admin/produtos/[id]/precos/[precoId]">) {
  await exigirAdmin();
  const { id, precoId } = await props.params;

  const preco = await db.precoFornecedor.findUnique({
    where: { id: precoId },
    include: {
      produto: { select: { id: true, nome: true } },
      historico: { include: { alteradoPor: { select: { nome: true } } }, orderBy: { alteradoEm: "desc" } },
    },
  });
  if (!preco || preco.produtoId !== id) notFound();
  const fornecedores = await fornecedoresParaPreco(preco.fornecedorId);

  return (
    <>
      <p className="mb-1 text-sm">
        <Link href="/admin/produtos" className={estilos.link}>
          Produtos
        </Link>{" "}
        /{" "}
        <Link href={`/admin/produtos/${preco.produto.id}/precos`} className={estilos.link}>
          {preco.produto.nome}
        </Link>
      </p>
      <Titulo>Editar faixa de preço</Titulo>

      <section className={`${estilos.cartao} mb-8 p-6`}>
        <FormPreco
          produtoId={preco.produtoId}
          fornecedores={fornecedores}
          validadePadrao={dataCivilParaIso(preco.validadeEstimativa)}
          preco={{
            id: preco.id,
            fornecedorId: preco.fornecedorId,
            valorUnitario: centavosParaTexto(preco.valorUnitarioCentavos),
            quantidadeMinima: preco.quantidadeMinima,
            prazoEntregaDias: preco.prazoEntregaDias,
            validadeEstimativa: dataCivilParaIso(preco.validadeEstimativa),
            observacoes: preco.observacoes,
          }}
        />
        <p className="mt-4 text-xs text-slate-500">
          Mudanças no valor unitário ficam registradas no histórico abaixo.
        </p>
      </section>

      <h2 className="mb-3 text-lg font-semibold">Histórico desta faixa</h2>
      <HistoricoPreco linhas={preco.historico} />
    </>
  );
}
