import Link from "next/link";
import { exigirUsuario } from "@/lib/auth/guards";
import { listarCatalogo } from "@/lib/consultas/catalogo";
import { AvisoEstimativa, FaixaPrecoReferencia } from "@/components/estimativa";
import { ImagemProduto } from "@/components/imagem-produto";
import { EstadoVazio, Titulo, estilos } from "@/components/ui";

export const metadata = { title: "Catálogo · Catálogo de Brindes" };

export default async function PaginaCatalogo(props: PageProps<"/catalogo">) {
  await exigirUsuario();
  const params = await props.searchParams;
  const busca = typeof params.q === "string" ? params.q : "";
  const categoria = typeof params.categoria === "string" ? params.categoria : "";
  const { itens, categorias } = await listarCatalogo({ busca, categoria });
  const filtrando = !!busca.trim() || !!categoria;

  return (
    <>
      <Titulo>Catálogo de brindes</Titulo>

      <form className="mb-6 flex flex-col gap-2 sm:flex-row" role="search">
        <label htmlFor="q" className="sr-only">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          defaultValue={busca}
          placeholder="Buscar brinde por nome ou descrição"
          className={`${estilos.input} sm:max-w-sm`}
        />
        <label htmlFor="categoria" className="sr-only">
          Categoria
        </label>
        <select id="categoria" name="categoria" defaultValue={categoria} className={`${estilos.input} sm:w-56`}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className={estilos.botao}>
            Filtrar
          </button>
          {filtrando && (
            <Link href="/catalogo" className={estilos.botaoSecundario}>
              Limpar
            </Link>
          )}
        </div>
      </form>

      {itens.length === 0 ? (
        <EstadoVazio titulo={filtrando ? "Nenhum brinde encontrado com esses filtros." : "O catálogo ainda não tem brindes."}>
          {filtrando ? "Tente outro termo ou outra categoria." : "Assim que o administrador cadastrar produtos, eles aparecerão aqui."}
        </EstadoVazio>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {itens.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/catalogo/${p.id}`}
                  className={`${estilos.cartao} group flex h-full flex-col overflow-hidden transition hover:border-marca-600 hover:shadow-md`}
                >
                  <ImagemProduto url={p.imagemUrl} nome={p.nome} className="aspect-[4/3] w-full" />
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{p.categoria}</p>
                    <h2 className="font-semibold text-slate-900 group-hover:text-marca-700">{p.nome}</h2>
                    <div className="mt-auto pt-2">
                      <FaixaPrecoReferencia faixa={p.faixa} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <AvisoEstimativa />
          </div>
        </>
      )}
    </>
  );
}
