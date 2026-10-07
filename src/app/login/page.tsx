import Image from "next/image";
import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth/sessao";
import { FormLogin } from "./form-login";

export const metadata = { title: "Entrar · Catálogo de Brindes" };

export default async function PaginaLogin() {
  if (await obterUsuarioAtual()) redirect("/");
  return (
    <main className="grid flex-1 bg-surface lg:grid-cols-2">
      {/* Foto com degradê na cor da marca para garantir a leitura do texto branco */}
      <section className="sobre-marca relative flex min-h-80 flex-col justify-between overflow-hidden bg-surface-brand px-6 py-10 text-on-brand sm:px-12 lg:p-16">
        <Image
          src="/imagens/login-presentes.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-surface-brand via-surface-brand/70 to-surface-brand/20"
          aria-hidden
        />

        <div className="relative">
          <p className="font-display text-4xl leading-none font-bold tracking-tight lowercase">alper</p>
          <p className="mt-2 text-xs tracking-[0.08em] text-on-brand/85 lowercase">alta performance em seguros</p>
        </div>

        <div className="relative mt-16 max-w-md">
          <h1 className="font-display text-4xl leading-[1.1] font-bold lg:text-5xl">Catálogo de Brindes</h1>
          <span className="mt-3 block h-1 w-12 rounded-pill bg-accent" aria-hidden />
          <p className="mt-4 text-base leading-7 text-on-brand/90 lg:text-lg">
            Consulte os brindes, veja uma estimativa na hora e envie sua solicitação de cotação.
          </p>
        </div>

        {/* Crédito exigido pela licença CC BY 2.0 */}
        <p className="absolute right-3 bottom-2 text-[11px] text-on-brand/70">
          Foto:{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:Brown_gift_box_with_red_ribbon_and_bow.jpg"
            className="underline hover:text-on-brand"
            target="_blank"
            rel="noopener noreferrer"
          >
            Shixart1985
          </a>
          ,{" "}
          <a
            href="https://creativecommons.org/licenses/by/2.0/deed.pt-br"
            className="underline hover:text-on-brand"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY 2.0
          </a>
        </p>
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
