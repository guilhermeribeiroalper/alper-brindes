import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import type { UsuarioSessao } from "@/lib/auth/permissoes";

const NOME_COOKIE = "brindes_sessao";
const DURACAO_MS = 12 * 60 * 60 * 1000; // 12 horas

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Cria a sessão no banco e grava o token no cookie. Só pode ser usada em Server Actions. */
export async function criarSessao(usuarioId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiraEm = new Date(Date.now() + DURACAO_MS);
  // Aproveita o login para limpar sessões expiradas.
  await db.sessao.deleteMany({ where: { expiraEm: { lt: new Date() } } });
  await db.sessao.create({ data: { tokenHash: hashToken(token), usuarioId, expiraEm } });

  const cookieStore = await cookies();
  cookieStore.set(NOME_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEm,
  });
}

/** Remove a sessão atual do banco e apaga o cookie. Só pode ser usada em Server Actions. */
export async function encerrarSessao(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_COOKIE)?.value;
  if (token) await db.sessao.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.delete(NOME_COOKIE);
}

/** Usuário da sessão atual, ou null se não houver sessão válida. Memoizado por requisição. */
export const obterUsuarioAtual = cache(async (): Promise<UsuarioSessao | null> => {
  const token = (await cookies()).get(NOME_COOKIE)?.value;
  if (!token) return null;

  const sessao = await db.sessao.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiraEm: true,
      usuario: {
        select: { id: true, nome: true, email: true, perfil: true, departamento: true, ativo: true },
      },
    },
  });
  if (!sessao || sessao.expiraEm <= new Date() || !sessao.usuario.ativo) return null;

  const { id, nome, email, perfil, departamento } = sessao.usuario;
  return { id, nome, email, perfil, departamento };
});

/** Invalida todas as sessões de um usuário (ao desativar ou redefinir a senha). */
export async function encerrarSessoesDoUsuario(usuarioId: string): Promise<void> {
  await db.sessao.deleteMany({ where: { usuarioId } });
}
