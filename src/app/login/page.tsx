import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth/sessao";
import { FormLogin } from "./form-login";

export const metadata = { title: "Entrar · Catálogo de Brindes" };

export default async function PaginaLogin() {
  if (await obterUsuarioAtual()) redirect("/");
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-marca-600">Alper</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Catálogo de Brindes</h1>
          <p className="mt-2 text-sm text-slate-500">Entre com seu e-mail corporativo.</p>
        </div>
        <FormLogin />
      </div>
    </main>
  );
}
