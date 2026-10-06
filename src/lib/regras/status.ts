// Fluxo de status da solicitação de cotação:
// RASCUNHO → ENVIADA → EM_ANALISE → RESPONDIDA, e CANCELADA a partir de RASCUNHO ou ENVIADA.
// Função pura, testada sem banco.

export type StatusSolicitacao = "RASCUNHO" | "ENVIADA" | "EM_ANALISE" | "RESPONDIDA" | "CANCELADA";

type Ator = { perfil: "ADMIN" | "SOLICITANTE"; ehDono: boolean };

const TRANSICOES: Record<StatusSolicitacao, StatusSolicitacao[]> = {
  RASCUNHO: ["ENVIADA", "CANCELADA"],
  ENVIADA: ["EM_ANALISE", "CANCELADA"],
  EM_ANALISE: ["RESPONDIDA"],
  RESPONDIDA: [],
  CANCELADA: [],
};

/** Quem executa cada transição: o dono envia e cancela; o admin analisa e responde. */
const EXECUTOR: Record<StatusSolicitacao, "DONO" | "ADMIN" | null> = {
  RASCUNHO: null,
  ENVIADA: "DONO",
  CANCELADA: "DONO",
  EM_ANALISE: "ADMIN",
  RESPONDIDA: "ADMIN",
};

export const ROTULO_STATUS: Record<StatusSolicitacao, string> = {
  RASCUNHO: "Rascunho",
  ENVIADA: "Enviada",
  EM_ANALISE: "Em análise",
  RESPONDIDA: "Respondida",
  CANCELADA: "Cancelada",
};

export type ResultadoTransicao = { ok: true } | { ok: false; erro: string };

export function validarTransicao(de: StatusSolicitacao, para: StatusSolicitacao, ator: Ator): ResultadoTransicao {
  if (!TRANSICOES[de].includes(para)) {
    return {
      ok: false,
      erro: `Não é possível mudar de "${ROTULO_STATUS[de]}" para "${ROTULO_STATUS[para]}".`,
    };
  }
  const executor = EXECUTOR[para];
  if (executor === "DONO" && !ator.ehDono) {
    return { ok: false, erro: "Somente o solicitante pode realizar esta ação." };
  }
  if (executor === "ADMIN" && ator.perfil !== "ADMIN") {
    return { ok: false, erro: "Somente o administrador pode realizar esta ação." };
  }
  return { ok: true };
}

export function podeCancelar(status: StatusSolicitacao): boolean {
  return TRANSICOES[status].includes("CANCELADA");
}
