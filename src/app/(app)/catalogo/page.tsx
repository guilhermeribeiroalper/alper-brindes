import { exigirUsuario } from "@/lib/auth/guards";
import { EstadoVazio, Titulo } from "@/components/ui";

// Implementado na etapa 4.
export default async function PaginaCatalogo() {
  await exigirUsuario();
  return (
    <>
      <Titulo>Catálogo de brindes</Titulo>
      <EstadoVazio titulo="Catálogo em construção." />
    </>
  );
}
