import Link from "next/link";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { EstadoVazio, Selo, Titulo, estilos } from "@/components/ui";

export const metadata = { title: "Fornecedores · Catálogo de Brindes" };

export default async function PaginaFornecedores() {
  await exigirAdmin();
  const fornecedores = await db.fornecedor.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { _count: { select: { precos: true } } },
  });

  return (
    <>
      <Titulo
        acoes={
          <Link href="/admin/fornecedores/novo" className={estilos.botao}>
            Novo fornecedor
          </Link>
        }
      >
        Fornecedores
      </Titulo>

      {fornecedores.length === 0 ? (
        <EstadoVazio titulo="Nenhum fornecedor cadastrado.">
          Cadastre o primeiro fornecedor para poder registrar preços.
        </EstadoVazio>
      ) : (
        <div className={`${estilos.cartao} overflow-x-auto`}>
          <table className={estilos.tabela}>
            <thead className="bg-slate-50">
              <tr>
                <th className={estilos.th}>Nome</th>
                <th className={estilos.th}>Contato</th>
                <th className={estilos.th}>Preços</th>
                <th className={estilos.th}>Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fornecedores.map((f) => (
                <tr key={f.id} className={f.ativo ? "" : "text-slate-500"}>
                  <td className={estilos.td}>
                    <Link href={`/admin/fornecedores/${f.id}`} className={estilos.link}>
                      {f.nome}
                    </Link>
                  </td>
                  <td className={estilos.td}>
                    <p>{f.contatoNome ?? "—"}</p>
                    <p className="text-xs text-slate-500">
                      {[f.contatoEmail, f.contatoTelefone].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className={estilos.td}>{f._count.precos}</td>
                  <td className={estilos.td}>{f.ativo ? <Selo cor="verde">Ativo</Selo> : <Selo>Inativo</Selo>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
