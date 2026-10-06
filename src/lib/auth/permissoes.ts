// Regras de autorização puras (sem acesso a banco ou cookies), para poderem
// ser testadas isoladamente. Os guards em guards.ts aplicam estas regras.

export type Perfil = "ADMIN" | "SOLICITANTE";

export type UsuarioSessao = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  departamento: string;
};

export type Requisito = "AUTENTICADO" | "ADMIN";

export type ResultadoAutorizacao =
  | { ok: true }
  | { ok: false; motivo: "NAO_AUTENTICADO" | "PROIBIDO" };

export function autorizar(
  usuario: UsuarioSessao | null,
  requisito: Requisito,
): ResultadoAutorizacao {
  if (!usuario) return { ok: false, motivo: "NAO_AUTENTICADO" };
  if (requisito === "ADMIN" && usuario.perfil !== "ADMIN") {
    return { ok: false, motivo: "PROIBIDO" };
  }
  return { ok: true };
}

export function ehAdmin(usuario: UsuarioSessao | null): boolean {
  return usuario?.perfil === "ADMIN";
}

/** Dono da solicitação ou ADMIN podem ver. */
export function podeVerSolicitacao(
  usuario: UsuarioSessao | null,
  solicitacao: { solicitanteId: string },
): boolean {
  if (!usuario) return false;
  return usuario.perfil === "ADMIN" || solicitacao.solicitanteId === usuario.id;
}

/** Só o dono altera os itens e envia ou cancela a própria solicitação. */
export function ehDonoDaSolicitacao(
  usuario: UsuarioSessao | null,
  solicitacao: { solicitanteId: string },
): boolean {
  return !!usuario && solicitacao.solicitanteId === usuario.id;
}

/** O admin não pode desativar a si mesmo nem retirar o próprio perfil ADMIN. */
export function podeAlterarUsuario(admin: UsuarioSessao, alvoId: string): boolean {
  return admin.perfil === "ADMIN" && admin.id !== alvoId;
}
