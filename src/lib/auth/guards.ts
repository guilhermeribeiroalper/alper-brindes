import "server-only";
import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth/sessao";
import { autorizar, type UsuarioSessao } from "@/lib/auth/permissoes";

// Chamar no início de TODA página protegida e de TODA Server Action.
// Verificações em layouts não bastam (layouts não re-renderizam a cada navegação).

export async function exigirUsuario(): Promise<UsuarioSessao> {
  const usuario = await obterUsuarioAtual();
  const resultado = autorizar(usuario, "AUTENTICADO");
  if (!resultado.ok || !usuario) redirect("/login");
  return usuario;
}

export async function exigirAdmin(): Promise<UsuarioSessao> {
  const usuario = await obterUsuarioAtual();
  const resultado = autorizar(usuario, "ADMIN");
  if (!resultado.ok || !usuario) {
    redirect(resultado.ok || resultado.motivo === "NAO_AUTENTICADO" ? "/login" : "/acesso-negado");
  }
  return usuario;
}
