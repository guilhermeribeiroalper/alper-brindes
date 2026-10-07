import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth/sessao";
import { FormLogin } from "./form-login";

export const metadata = { title: "Entrar · Catálogo de Brindes" };

export default async function PaginaLogin() {
  if (await obterUsuarioAtual()) redirect("/");
  return (
    <main className="grid flex-1 bg-surface lg:grid-cols-2">
      {/* Painel da marca: surface-brand com grafismo em accent */}
      <section className="sobre-marca relative overflow-hidden bg-surface-brand px-6 py-10 text-on-brand sm:px-12 lg:flex lg:flex-col lg:justify-between lg:p-16">
        <div className="grafismo pointer-events-none absolute inset-0 opacity-80" aria-hidden />
        <div className="pointer-events-none absolute right-0 bottom-0 h-24 w-2/3 bg-accent/90 lg:h-32" aria-hidden />

        <div className="relative">
          <p className="font-display text-4xl leading-none font-bold tracking-tight lowercase">alper</p>
          <p className="mt-2 text-xs tracking-[0.08em] text-on-brand/80 lowercase">alta performance em seguros</p>
        </div>

        <div className="relative mt-10 max-w-md lg:mt-0 lg:mb-32">
          <h1 className="font-display text-4xl leading-[1.1] font-bold lg:text-5xl">Catálogo de Brindes</h1>
          <p className="mt-4 text-base leading-7 text-on-brand/85 lg:text-lg">
            Consulte os brindes, veja uma estimativa na hora e envie sua solicitação de cotação.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-[28px] leading-[1.2] font-semibold text-on-surface">Entrar</h2>
          <span className="mt-2 block h-1 w-12 rounded-pill bg-accent" aria-hidden />
          <p className="mt-4 mb-6 text-sm text-on-surface-muted">Use seu e-mail corporativo.</p>
          <FormLogin />
          <p className="mt-8 text-xs text-on-surface-muted">Se é seguro, é Alper.</p>
        </div>
      </section>
    </main>
  );
}
