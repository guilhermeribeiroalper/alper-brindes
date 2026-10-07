import type { ReactNode } from "react";

// Componentes base no Alper Design System. Cores pelos tokens semânticos de globals.css.
// Contraste: texto de ação usa brand-navy ou interactive-hover (≥ 5,4:1 sobre branco);
// bordas de controles usam brand-gray (≥ 3:1).
export const estilos = {
  botao:
    "inline-flex items-center justify-center gap-2 rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-on-brand shadow-sm transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60",
  botaoSecundario:
    "inline-flex items-center justify-center gap-2 rounded-md border border-brand-navy bg-surface px-4 py-2 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60",
  botaoPerigo:
    "inline-flex items-center justify-center gap-2 rounded-md border border-error bg-surface px-4 py-2 text-sm font-semibold text-error transition-colors hover:bg-error/5 disabled:cursor-not-allowed disabled:opacity-60",
  botaoPequeno:
    "inline-flex items-center justify-center rounded-sm border border-brand-gray bg-surface px-2.5 py-1 text-xs font-semibold text-on-surface transition-colors hover:border-brand-navy hover:bg-surface-alt disabled:opacity-60",
  input:
    "block w-full rounded-sm border border-brand-gray bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy aria-[invalid=true]:border-error",
  cartao: "rounded-md border border-border bg-surface shadow-sm",
  link: "font-semibold text-interactive-hover underline-offset-2 hover:text-brand-navy hover:underline",
  tabela: "min-w-full divide-y divide-border text-sm",
  th: "bg-surface-alt px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-muted",
  td: "px-3 py-2.5 align-top",
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
    <div className="space-y-1.5">
      <label htmlFor={nome} className="block text-sm font-semibold text-on-surface">
        {rotulo}
      </label>
      {children}
      {ajuda && !erros?.length && <p className="text-xs text-on-surface-muted">{ajuda}</p>}
      {erros?.map((e) => (
        <p key={e} id={`${nome}-erro`} className="text-xs font-semibold text-error">
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
    info: "border-info/40 bg-info/5 text-on-surface",
    erro: "border-error/40 bg-error/5 text-error",
    sucesso: "border-success/50 bg-success/10 text-on-surface",
    aviso: "border-warning/60 bg-warning/10 text-on-surface",
  };
  return (
    <div role={tipo === "erro" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${cores[tipo]}`}>
      {children}
    </div>
  );
}

export function EstadoVazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="font-semibold text-on-surface">{titulo}</p>
      {children && <div className="mt-2 text-sm text-on-surface-muted">{children}</div>}
    </div>
  );
}

/** Selo de status: pílula clara com ponto na cor semântica e texto navy (contraste garantido). */
export function Selo({
  cor = "cinza",
  children,
}: {
  cor?: "cinza" | "verde" | "azul" | "amarelo" | "vermelho" | "roxo";
  children: ReactNode;
}) {
  const pontos = {
    cinza: "bg-brand-gray",
    verde: "bg-success",
    azul: "bg-brand-royal",
    amarelo: "bg-warning",
    vermelho: "bg-error",
    roxo: "bg-brand-teal",
  };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-alt px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-on-surface">
      <span className={`size-2 rounded-pill ${pontos[cor]}`} aria-hidden />
      {children}
    </span>
  );
}

export function Titulo({ children, acoes }: { children: ReactNode; acoes?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-[28px] leading-[1.2] font-semibold text-on-surface">{children}</h1>
        {/* Traço decorativo em accent, derivado do grafismo da marca */}
        <span className="mt-2 block h-1 w-12 rounded-pill bg-accent" aria-hidden />
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div className="flex items-center gap-3 py-12 text-sm text-on-surface-muted" role="status">
      <span className="size-4 animate-spin rounded-pill border-2 border-border border-t-brand-navy" />
      {texto}
    </div>
  );
}
