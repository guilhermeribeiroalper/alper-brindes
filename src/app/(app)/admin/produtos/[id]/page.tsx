import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { alterarAtivoProduto } from "@/actions/produtos";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Alerta, Selo, Titulo, estilos } from "@/components/ui";
import { FormProduto } from "../form";

export const metadata = { title: "Editar produto · Catálogo de Brindes" };

export default async function EditarProduto(props: PageProps<"/admin/produtos/[id]">) {
  await exigirAdmin();
  const { id } = await props.params;
  const [produto, categorias] = await Promise.all([
    db.produto.findUnique({ where: { id } }),
    db.produto.findMany({ distinct: ["categoria"], select: { categoria: true }, orderBy: { categoria: "asc" } }),
  ]);
  if (!produto) notFound();

  return (
    <>
      <Titulo
        acoes={
          <>
            <Link href={`/admin/produtos/${produto.id}/precos`} className={estilos.botaoSecundario}>
              Preços e histórico
            </Link>
            <form action={alterarAtivoProduto}>
              <input type="hidden" name="id" value={produto.id} />
              <input type="hidden" name="ativo" value={String(!produto.ativo)} />
              <BotaoEnviar variante={produto.ativo ? "botaoPerigo" : "botaoSecundario"} pendente="…">
                {produto.ativo ? "Desativar produto" : "Reativar produto"}
              </BotaoEnviar>
            </form>
          </>
        }
      >
        {produto.nome} {!produto.ativo && <Selo>Inativo</Selo>}
      </Titulo>
      {!produto.ativo && (
        <div className="mb-4">
          <Alerta tipo="aviso">
            Produto inativo: não aparece no catálogo nem em novas estimativas, mas continua nas solicitações antigas.
          </Alerta>
        </div>
      )}
      <FormProduto produto={produto} categorias={categorias.map((c) => c.categoria)} />
    </>
  );
}
