import Link from "next/link";
import { estilos } from "@/components/ui";

export const metadata = { title: "Acesso negado · Catálogo de Brindes" };

export default function AcessoNegado() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="font-display text-[28px] leading-[1.2] font-semibold text-on-surface">Acesso negado</h1>
      <p className="max-w-md text-on-surface">Seu perfil não tem permissão para acessar esta página.</p>
      <Link href="/catalogo" className={estilos.botao}>
        Voltar ao catálogo
      </Link>
    </main>
  );
}
