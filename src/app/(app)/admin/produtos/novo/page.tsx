import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { Titulo } from "@/components/ui";
import { FormProduto } from "../form";

export const metadata = { title: "Novo produto · Catálogo de Brindes" };

export default async function NovoProduto() {
  await exigirAdmin();
  const categorias = await db.produto.findMany({ distinct: ["categoria"], select: { categoria: true }, orderBy: { categoria: "asc" } });
  return (
    <>
      <Titulo>Novo produto</Titulo>
      <FormProduto categorias={categorias.map((c) => c.categoria)} />
    </>
  );
}
