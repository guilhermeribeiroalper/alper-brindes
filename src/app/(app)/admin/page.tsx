import { exigirAdmin } from "@/lib/auth/guards";
import { EstadoVazio, Titulo } from "@/components/ui";

// Implementado na etapa 5.
export default async function PainelAdmin() {
  await exigirAdmin();
  return (
    <>
      <Titulo>Painel</Titulo>
      <EstadoVazio titulo="Painel em construção." />
    </>
  );
}
