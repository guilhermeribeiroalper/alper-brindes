"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sair } from "@/actions/auth";
import { LogoAlper } from "@/components/logo-alper";
import type { Perfil } from "@/lib/auth/permissoes";

const LINKS_TODOS = [
  { href: "/catalogo", rotulo: "Catálogo" },
  { href: "/minha-solicitacao", rotulo: "Minha solicitação" },
  { href: "/solicitacoes", rotulo: "Minhas solicitações" },
];

const LINKS_ADMIN = [
  { href: "/admin", rotulo: "Painel" },
  { href: "/admin/solicitacoes", rotulo: "Fila" },
  { href: "/admin/produtos", rotulo: "Produtos" },
  { href: "/admin/fornecedores", rotulo: "Fornecedores" },
  { href: "/admin/usuarios", rotulo: "Usuários" },
];

function estaAtivo(caminho: string, href: string) {
  return href === "/admin" ? caminho === "/admin" : caminho === href || caminho.startsWith(`${href}/`);
}

function Contador({ valor }: { valor: number }) {
  return (
    <span
      className="ml-2 inline-flex min-w-5 justify-center rounded-pill bg-brand-lime px-1.5 py-0.5 text-xs font-bold text-brand-navy"
      aria-label={`${valor} ${valor === 1 ? "item" : "itens"}`}
    >
      {valor}
    </span>
  );
}

/** Aba da barra (telas grandes): página atual marcada com traço em accent. */
function Aba({ href, rotulo, caminho, contador }: { href: string; rotulo: string; caminho: string; contador?: number }) {
  const atual = estaAtivo(caminho, href);
  return (
    <Link
      href={href}
      aria-current={atual ? "page" : undefined}
      className={`relative inline-flex items-center px-3 py-3 text-sm font-semibold transition-colors ${
        atual ? "text-on-brand" : "text-on-brand/75 hover:text-on-brand"
      }`}
    >
      {rotulo}
      {!!contador && <Contador valor={contador} />}
      {atual && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-sm bg-accent" aria-hidden />}
    </Link>
  );
}

/** Item do menu recolhível (telas pequenas). */
function ItemMovel({ href, rotulo, caminho, contador }: { href: string; rotulo: string; caminho: string; contador?: number }) {
  const atual = estaAtivo(caminho, href);
  return (
    <Link
      href={href}
      aria-current={atual ? "page" : undefined}
      className={`flex items-center rounded-md px-3 py-2 text-sm font-semibold ${
        atual ? "bg-on-brand/10 text-on-brand" : "text-on-brand/80 hover:bg-on-brand/10"
      }`}
    >
      {atual && <span className="mr-2 size-2 rounded-pill bg-accent" aria-hidden />}
      {rotulo}
      {!!contador && <Contador valor={contador} />}
    </Link>
  );
}

function Marca() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-5">
      <LogoAlper prioridade />
      <span className="hidden h-10 w-px bg-on-brand/30 sm:block" aria-hidden />
      <span className="hidden text-base font-semibold text-on-brand/90 sm:inline">Catálogo de Brindes</span>
    </Link>
  );
}

export function Navegacao({ nome, perfil, itensCarrinho }: { nome: string; perfil: Perfil; itensCarrinho: number }) {
  const caminho = usePathname();
  const admin = perfil === "ADMIN";
  const contadorDe = (href: string) => (href === "/minha-solicitacao" ? itensCarrinho : undefined);

  const usuario = (
    <form action={sair} className="flex items-center gap-3">
      <span className="text-sm text-on-brand/85">
        {nome}
        {admin && (
          <span className="ml-2 rounded-sm bg-brand-royal px-1.5 py-0.5 text-xs font-semibold text-on-brand">Admin</span>
        )}
      </span>
      <button
        type="submit"
        className="rounded-pill border border-on-brand/40 px-3 py-1 text-sm font-semibold text-on-brand transition-colors hover:border-accent hover:text-accent"
      >
        Sair
      </button>
    </form>
  );

  return (
    <header className="sobre-marca relative overflow-hidden bg-surface-brand text-on-brand">

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-4">
          <Marca />
          <div className="hidden lg:block">{usuario}</div>

          {/* Menu recolhível em telas pequenas */}
          <details className="relative lg:hidden">
            <summary className="cursor-pointer list-none rounded-pill border border-on-brand/40 px-4 py-1.5 text-sm font-semibold">
              Menu
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-72 space-y-1 rounded-lg bg-surface-brand p-3 shadow-lg ring-1 ring-on-brand/15">
              <nav aria-label="Principal (celular)" className="space-y-1">
                {LINKS_TODOS.map((l) => (
                  <ItemMovel key={l.href} {...l} caminho={caminho} contador={contadorDe(l.href)} />
                ))}
                {admin && (
                  <>
                    <p className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-on-brand/70 uppercase">Administração</p>
                    {LINKS_ADMIN.map((l) => (
                      <ItemMovel key={l.href} {...l} caminho={caminho} />
                    ))}
                  </>
                )}
              </nav>
              <div className="mt-2 border-t border-on-brand/15 pt-3">{usuario}</div>
            </div>
          </details>
        </div>

        <nav className="-mx-3 hidden items-center lg:flex" aria-label="Principal">
          {LINKS_TODOS.map((l) => (
            <Aba key={l.href} {...l} caminho={caminho} contador={contadorDe(l.href)} />
          ))}
          {admin && (
            <>
              <span className="mx-3 h-5 w-px bg-on-brand/30" aria-hidden />
              <span className="pr-1 text-xs font-semibold tracking-wide text-on-brand/70 uppercase">Admin</span>
              {LINKS_ADMIN.map((l) => (
                <Aba key={l.href} {...l} caminho={caminho} />
              ))}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
