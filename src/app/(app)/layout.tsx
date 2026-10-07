import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth/sessao";
import { contarItensRascunho } from "@/lib/consultas/solicitacoes";
import { Navegacao } from "@/components/navegacao";

// O layout só monta a navegação. A autorização é verificada em cada página e action.
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login");
  const itensCarrinho = await contarItensRascunho(usuario.id);

  return (
    <>
      <Navegacao nome={usuario.nome} perfil={usuario.perfil} itensCarrinho={itensCarrinho} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-10">{children}</main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-2 px-4 py-4 text-xs text-on-surface-muted sm:px-6">
          <span>
            <span className="font-display text-sm font-bold text-on-surface lowercase">alper</span> · alta performance em seguros
          </span>
          <span>Catálogo de Brindes · uso interno</span>
        </div>
      </footer>
    </>
  );
}
