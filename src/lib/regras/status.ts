// Fluxo de status da solicitação de cotação (funções puras, testadas sem banco):
//
//   RASCUNHO → ENVIADA → EM_ANALISE → APROVADA
//
// Cancelamento: o solicitante cancela a própria solicitação em RASCUNHO ou ENVIADA;
// o admin cancela (com motivo) em ENVIADA ou EM_ANALISE. APROVADA e CANCELADA são finais.

export type StatusSolicitacao = "RASCUNHO" | "ENVIADA" | "EM_ANALISE" | "APROVADA" | "CANCELADA";

type Ator = { perfil: "ADMIN" | "SOLICITANTE"; ehDono: boolean };
type Executor = "DONO" | "ADMIN";

const REGRAS: { de: StatusSolicitacao; para: StatusSolicitacao; quem: Executor }[] = [
  { de: "RASCUNHO", para: "ENVIADA", quem: "DONO" },
  { de: "RASCUNHO", para: "CANCELADA", quem: "DONO" },
  { de: "ENVIADA", para: "CANCELADA", quem: "DONO" },
  { de: "ENVIADA", para: "EM_ANALISE", quem: "ADMIN" },
  { de: "ENVIADA", para: "CANCELADA", quem: "ADMIN" },
  { de: "EM_ANALISE", para: "APROVADA", quem: "ADMIN" },
  { de: "EM_ANALISE", para: "CANCELADA", quem: "ADMIN" },
];

export const ROTULO_STATUS: Record<StatusSolicitacao, string> = {
  RASCUNHO: "Rascunho",
  ENVIADA: "Enviada",
  EM_ANALISE: "Em análise",
  APROVADA: "Aprovada",
  CANCELADA: "Cancelada",
};

export type ResultadoTransicao = { ok: true } | { ok: false; erro: string };

function atende(quem: Executor, ator: Ator): boolean {
  return quem === "DONO" ? ator.ehDono : ator.perfil === "ADMIN";
}

export function validarTransicao(de: StatusSolicitacao, para: StatusSolicitacao, ator: Ator): ResultadoTransicao {
  const regras = REGRAS.filter((r) => r.de === de && r.para === para);
  if (regras.length === 0) {
    return {
      ok: false,
      erro: `Não é possível mudar de "${ROTULO_STATUS[de]}" para "${ROTULO_STATUS[para]}".`,
    };
  }
  if (regras.some((r) => atende(r.quem, ator))) return { ok: true };
  return {
    ok: false,
    erro:
      regras[0].quem === "DONO"
        ? "Somente o solicitante pode realizar esta ação."
        : "Somente o administrador pode realizar esta ação.",
  };
}

/** O solicitante pode cancelar a própria solicitação neste status? */
export function podeCancelar(status: StatusSolicitacao): boolean {
  return REGRAS.some((r) => r.de === status && r.para === "CANCELADA" && r.quem === "DONO");
}

/** O admin pode cancelar a solicitação neste status? */
export function adminPodeCancelar(status: StatusSolicitacao): boolean {
  return REGRAS.some((r) => r.de === status && r.para === "CANCELADA" && r.quem === "ADMIN");
}
