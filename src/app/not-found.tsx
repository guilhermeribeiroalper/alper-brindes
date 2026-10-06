import Link from "next/link";
import { estilos } from "@/components/ui";

export default function NaoEncontrado() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-slate-600">O endereço não existe ou o registro foi removido.</p>
      <Link href="/" className={estilos.botao}>
        Ir para o início
      </Link>
    </main>
  );
}
