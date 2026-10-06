import type { ReactNode } from "react";

export const estilos = {
  botao:
    "inline-flex items-center justify-center gap-2 rounded-md bg-marca-600 px-4 py-2 text-sm font-medium text-white hover:bg-marca-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 disabled:cursor-not-allowed disabled:opacity-60",
  botaoSecundario:
    "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 disabled:cursor-not-allowed disabled:opacity-60",
  botaoPerigo:
    "inline-flex items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60",
  botaoPequeno:
    "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60",
  input:
    "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-marca-600 focus:outline-none focus:ring-1 focus:ring-marca-600 aria-[invalid=true]:border-red-500",
  cartao: "rounded-lg border border-slate-200 bg-white shadow-sm",
  link: "font-medium text-marca-600 hover:text-marca-800 hover:underline",
  tabela: "min-w-full divide-y divide-slate-200 text-sm",
  th: "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  td: "px-3 py-2 align-top",
};

export function Campo({
  rotulo,
  nome,
  erros,
  ajuda,
  children,
}: {
  rotulo: string;
  nome: string;
  erros?: string[];
  ajuda?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={nome} className="block text-sm font-medium text-slate-700">
        {rotulo}
      </label>
      {children}
      {ajuda && !erros?.length && <p className="text-xs text-slate-500">{ajuda}</p>}
      {erros?.map((e) => (
        <p key={e} id={`${nome}-erro`} className="text-xs text-red-600">
          {e}
        </p>
      ))}
    </div>
  );
}

export function Alerta({
  tipo = "info",
  children,
}: {
  tipo?: "info" | "erro" | "sucesso" | "aviso";
  children: ReactNode;
}) {
  const cores = {
    info: "border-marca-100 bg-marca-50 text-marca-800",
    erro: "border-red-200 bg-red-50 text-red-800",
    sucesso: "border-emerald-200 bg-emerald-50 text-emerald-800",
    aviso: "border-amber-200 bg-amber-50 text-amber-900",
  };
  return (
    <div role={tipo === "erro" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${cores[tipo]}`}>
      {children}
    </div>
  );
}

export function EstadoVazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="font-medium text-slate-700">{titulo}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function Selo({ cor = "cinza", children }: { cor?: "cinza" | "verde" | "azul" | "amarelo" | "vermelho" | "roxo"; children: ReactNode }) {
  const cores = {
    cinza: "bg-slate-100 text-slate-700",
    verde: "bg-emerald-100 text-emerald-800",
    azul: "bg-marca-100 text-marca-800",
    amarelo: "bg-amber-100 text-amber-900",
    vermelho: "bg-red-100 text-red-800",
    roxo: "bg-violet-100 text-violet-800",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cores[cor]}`}>{children}</span>;
}

export function Titulo({ children, acoes }: { children: ReactNode; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold text-slate-900">{children}</h1>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div className="flex items-center gap-3 py-12 text-sm text-slate-500" role="status">
      <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-marca-600" />
      {texto}
    </div>
  );
}
