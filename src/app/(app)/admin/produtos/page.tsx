import Link from "next/link";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { EstadoVazio, Selo, Titulo, estilos } from "@/components/ui";
import { hojeCivil } from "@/lib/datas";
import { normalizarBusca } from "@/lib/formatacao";

export const metadata = { title: "Produtos · Catálogo de Brindes" };

export default async function PaginaProdutos(props: PageProps<"/admin/produtos">) {
  await exigirAdmin();
  const params = await props.searchParams;
  const busca = typeof params.q === "string" ? params.q.trim() : "";
  const hoje = hojeCivil();

  const todos = await db.produto.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: {
      precos: {
        select: { ativo: true, validadeEstimativa: true, fornecedor: { select: { ativo: true } } },
      },
    },
  });
  // Filtro em memória: ignora maiúsculas e acentos igualmente em SQLite e PostgreSQL.
  const termo = normalizarBusca(busca);
  const produtos = termo
    ? todos.filter((p) => normalizarBusca(`${p.nome} ${p.categoria}`).includes(termo))
    : todos;

  return (
    <>
      <Titulo
        acoes={
          <Link href="/admin/produtos/novo" className={estilos.botao}>
            Novo produto
          </Link>
        }
      >
        Produtos
      </Titulo>

      <form className="mb-4 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Buscar produto
        </label>
        <input id="q" name="q" defaultValue={busca} placeholder="Buscar por nome ou categoria" className={`${estilos.input} max-w-sm`} />
        <button type="submit" className={estilos.botaoSecundario}>
          Buscar
        </button>
      </form>

      {produtos.length === 0 ? (
        <EstadoVazio titulo={busca ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."} />
      ) : (
        <div className={`${estilos.cartao} overflow-x-auto`}>
          <table className={estilos.tabela}>
            <thead className="bg-slate-50">
              <tr>
                <th className={estilos.th}>Produto</th>
                <th className={estilos.th}>Categoria</th>
                <th className={estilos.th}>Preços vigentes</th>
                <th className={estilos.th}>Situação</th>
                <th className={estilos.th}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {produtos.map((p) => {
                const vigentes = p.precos.filter(
                  (pr) => pr.ativo && pr.fornecedor.ativo && pr.validadeEstimativa >= hoje,
                ).length;
                return (
                  <tr key={p.id} className={p.ativo ? "" : "text-slate-500"}>
                    <td className={estilos.td}>
                      <Link href={`/admin/produtos/${p.id}`} className={estilos.link}>
                        {p.nome}
                      </Link>
                    </td>
                    <td className={estilos.td}>{p.categoria}</td>
                    <td className={estilos.td}>
                      {vigentes > 0 ? (
                        `${vigentes} de ${p.precos.length}`
                      ) : (
                        <Selo cor="amarelo">{p.precos.length ? "Nenhum vigente" : "Sem preço"}</Selo>
                      )}
                    </td>
                    <td className={estilos.td}>{p.ativo ? <Selo cor="verde">Ativo</Selo> : <Selo>Inativo</Selo>}</td>
                    <td className={estilos.td}>
                      <Link href={`/admin/produtos/${p.id}/precos`} className={estilos.link}>
                        Preços
                      </Link>
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
