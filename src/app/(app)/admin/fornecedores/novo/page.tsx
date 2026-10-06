import { exigirAdmin } from "@/lib/auth/guards";
import { Titulo } from "@/components/ui";
import { FormFornecedor } from "../form";

export const metadata = { title: "Novo fornecedor · Catálogo de Brindes" };

export default async function NovoFornecedor() {
  await exigirAdmin();
  return (
    <>
      <Titulo>Novo fornecedor</Titulo>
      <FormFornecedor />
    </>
  );
}
