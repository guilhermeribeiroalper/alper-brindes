import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { alterarAtivoFornecedor } from "@/actions/fornecedores";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Alerta, Selo, Titulo, estilos } from "@/components/ui";
import { formatarBRL, formatarData } from "@/lib/formatacao";
import { FormFornecedor } from "../form";

export const metadata = { title: "Editar fornecedor · Catálogo de Brindes" };

export default async function EditarFornecedor(props: PageProps<"/admin/fornecedores/[id]">) {
  await exigirAdmin();
  const { id } = await props.params;
  const fornecedor = await db.fornecedor.findUnique({
    where: { id },
    include: {
      precos: {
        include: { produto: { select: { id: true, nome: true } } },
        orderBy: [{ produto: { nome: "asc" } }, { quantidadeMinima: "asc" }],
      },
    },
  });
  if (!fornecedor) notFound();

  return (
    <>
      <Titulo
        acoes={
          <form action={alterarAtivoFornecedor}>
            <input type="hidden" name="id" value={fornecedor.id} />
            <input type="hidden" name="ativo" value={String(!fornecedor.ativo)} />
            <BotaoEnviar variante={fornecedor.ativo ? "botaoPerigo" : "botaoSecundario"} pendente="…">
              {fornecedor.ativo ? "Desativar fornecedor" : "Reativar fornecedor"}
            </BotaoEnviar>
          </form>
        }
      >
        {fornecedor.nome} {!fornecedor.ativo && <Selo>Inativo</Selo>}
      </Titulo>

      {!fornecedor.ativo && (
        <div className="mb-4">
          <Alerta tipo="aviso">
            Fornecedor inativo: os preços dele não entram em novas estimativas, mas as solicitações antigas são mantidas.
          </Alerta>
        </div>
      )}

      <FormFornecedor fornecedor={fornecedor} />

      <h2 className="mb-3 mt-8 font-display text-xl font-semibold text-on-surface">Preços deste fornecedor</h2>
      {fornecedor.precos.length === 0 ? (
        <p className="text-sm text-on-surface-muted">Nenhum preço cadastrado.</p>
      ) : (
        <div className={`${estilos.cartao} overflow-x-auto`}>
          <table className={estilos.tabela}>
            <thead className="bg-surface-alt">
              <tr>
                <th className={estilos.th}>Produto</th>
                <th className={estilos.th}>Qtd. mínima</th>
                <th className={estilos.th}>Valor unit.</th>
                <th className={estilos.th}>Validade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fornecedor.precos.map((p) => (
                <tr key={p.id}>
                  <td className={estilos.td}>
                    <Link href={`/admin/produtos/${p.produto.id}/precos`} className={estilos.link}>
                      {p.produto.nome}
                    </Link>
                  </td>
                  <td className={estilos.td}>{p.quantidadeMinima}</td>
                  <td className={estilos.td}>{formatarBRL(p.valorUnitarioCentavos)}</td>
                  <td className={estilos.td}>{formatarData(p.validadeEstimativa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
