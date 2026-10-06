import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth/guards";
import { estimarProduto, obterProdutoCatalogo } from "@/lib/consultas/catalogo";
import { FaixaPrecoReferencia } from "@/components/estimativa";
import { ImagemProduto } from "@/components/imagem-produto";
import { estilos } from "@/components/ui";
import { Simulador } from "./simulador";

export default async function DetalheProduto(props: PageProps<"/catalogo/[id]">) {
  await exigirUsuario();
  const { id } = await props.params;
  const produto = await obterProdutoCatalogo(id);
  if (!produto) notFound();

  const quantidadeInicial = produto.faixa?.quantidadeMinima ?? 1;
  const estimativaInicial = await estimarProduto(produto.id, quantidadeInicial);

  return (
    <>
      <p className="mb-4 text-sm">
        <Link href="/catalogo" className={estilos.link}>
          ← Voltar ao catálogo
        </Link>
      </p>
      <div className="grid gap-8 lg:grid-cols-2">
        <ImagemProduto url={produto.imagemUrl} nome={produto.nome} className="aspect-[4/3] w-full rounded-lg" />
        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{produto.categoria}</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{produto.nome}</h1>
            {produto.descricao && <p className="mt-3 whitespace-pre-line text-slate-700">{produto.descricao}</p>}
            <div className="mt-4">
              <p className="text-xs text-slate-500">Preço de referência</p>
              <FaixaPrecoReferencia faixa={produto.faixa} />
            </div>
          </div>

          <section className={`${estilos.cartao} p-5`}>
            <h2 className="mb-4 text-lg font-semibold">Simular estimativa</h2>
            <Simulador
              produtoId={produto.id}
              quantidadeInicial={quantidadeInicial}
              estimativaInicial={estimativaInicial}
            />
          </section>
        </div>
      </div>
    </>
  );
}
