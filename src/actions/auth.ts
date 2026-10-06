"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { criarSessao, encerrarSessao } from "@/lib/auth/sessao";
import { obterHashFicticio, verificarSenha } from "@/lib/auth/senha";
import { esquemaLogin } from "@/lib/validacao/usuario";
import type { EstadoForm } from "@/lib/validacao/comum";

// Login e logout são as únicas actions públicas (não exigem sessão).

export async function entrar(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const dados = esquemaLogin.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  const valores = { email: String(formData.get("email") ?? "") };
  if (!dados.success) return { erro: "Informe e-mail e senha.", valores };

  const usuario = await db.usuario.findUnique({
    where: { email: dados.data.email },
    select: { id: true, senhaHash: true, ativo: true, perfil: true },
  });
  const senhaOk = await verificarSenha(
    dados.data.senha,
    usuario?.senhaHash ?? (await obterHashFicticio()),
  );
  if (!usuario || !senhaOk) return { erro: "E-mail ou senha incorretos.", valores };
  if (!usuario.ativo) return { erro: "Usuário desativado. Procure o administrador.", valores };

  await criarSessao(usuario.id);
  redirect(usuario.perfil === "ADMIN" ? "/admin" : "/catalogo");
}

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/login");
}
