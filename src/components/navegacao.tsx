"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sair } from "@/actions/auth";
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

function ItemMenu({ href, rotulo, caminho }: { href: string; rotulo: string; caminho: string }) {
  const atual = estaAtivo(caminho, href);
  return (
    <Link
      href={href}
      aria-current={atual ? "page" : undefined}
      className={`block rounded-md px-3 py-2 text-sm font-medium ${
        atual ? "bg-marca-700 text-white" : "text-marca-50 hover:bg-marca-700/60"
      }`}
    >
      {rotulo}
    </Link>
  );
}

export function Navegacao({ nome, perfil }: { nome: string; perfil: Perfil }) {
  const caminho = usePathname();
  const admin = perfil === "ADMIN";

  const menu = (
    <>
      {LINKS_TODOS.map((l) => (
        <ItemMenu key={l.href} {...l} caminho={caminho} />
      ))}
      {admin && <span className="mx-2 hidden h-6 w-px bg-marca-600 lg:block" aria-hidden />}
      {admin && LINKS_ADMIN.map((l) => <ItemMenu key={l.href} {...l} caminho={caminho} />)}
    </>
  );

  const usuario = (
    <form action={sair} className="flex items-center gap-3">
      <span className="text-sm text-marca-100">
        {nome}
        {admin && <span className="ml-2 rounded bg-marca-600 px-1.5 py-0.5 text-xs text-white">Admin</span>}
      </span>
      <button
        type="submit"
        className="rounded-md border border-marca-600 px-3 py-1.5 text-sm text-white hover:bg-marca-700"
      >
        Sair
      </button>
    </form>
  );

  return (
    <header className="bg-marca-800 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0 font-semibold">
          Brindes <span className="font-normal text-marca-100">· Alper</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Principal">
          {menu}
        </nav>
        <div className="hidden lg:block">{usuario}</div>

        {/* Menu recolhível em telas pequenas */}
        <details className="relative lg:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-marca-600 px-3 py-1.5 text-sm">
            Menu
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-64 space-y-1 rounded-lg bg-marca-800 p-3 shadow-lg ring-1 ring-marca-700">
            <nav aria-label="Principal (celular)" className="space-y-1">
              {menu}
            </nav>
            <div className="border-t border-marca-700 pt-3">{usuario}</div>
          </div>
        </details>
      </div>
    </header>
  );
}
