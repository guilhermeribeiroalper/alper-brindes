"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { podeAlterarUsuario } from "@/lib/auth/permissoes";
import { gerarHashSenha } from "@/lib/auth/senha";
import { encerrarSessoesDoUsuario } from "@/lib/auth/sessao";
import { errosDeValidacao, valoresDoForm, type EstadoForm } from "@/lib/validacao/comum";
import { esquemaNovoUsuario, esquemaRedefinirSenha } from "@/lib/validacao/usuario";

const CAMINHO = "/admin/usuarios";

export async function criarUsuario(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirAdmin();
  const dados = esquemaNovoUsuario.safeParse(Object.fromEntries(formData));
  if (!dados.success) return errosDeValidacao(dados.error, formData);

  const existente = await db.usuario.findUnique({ where: { email: dados.data.email } });
  if (existente) return { erro: "Já existe um usuário com este e-mail.", errosCampo: { email: ["E-mail já cadastrado."] }, valores: valoresDoForm(formData) };

  const { senha, ...resto } = dados.data;
  await db.usuario.create({ data: { ...resto, senhaHash: await gerarHashSenha(senha) } });
  revalidatePath(CAMINHO);
  return { sucesso: `Usuário ${resto.nome} criado.` };
}

export async function alterarAtivoUsuario(formData: FormData): Promise<void> {
  const admin = await exigirAdmin();
  const usuarioId = String(formData.get("usuarioId") ?? "");
  const ativo = formData.get("ativo") === "true";
  if (!podeAlterarUsuario(admin, usuarioId)) throw new Error("Você não pode desativar o próprio usuário.");

  await db.usuario.update({ where: { id: usuarioId }, data: { ativo } });
  if (!ativo) await encerrarSessoesDoUsuario(usuarioId);
  revalidatePath(CAMINHO);
}

export async function alterarPerfilUsuario(formData: FormData): Promise<void> {
  const admin = await exigirAdmin();
  const usuarioId = String(formData.get("usuarioId") ?? "");
  const perfil = formData.get("perfil");
  if (perfil !== "ADMIN" && perfil !== "SOLICITANTE") throw new Error("Perfil inválido.");
  if (!podeAlterarUsuario(admin, usuarioId)) throw new Error("Você não pode alterar o próprio perfil.");

  await db.usuario.update({ where: { id: usuarioId }, data: { perfil } });
  revalidatePath(CAMINHO);
}

export async function redefinirSenha(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirAdmin();
  const dados = esquemaRedefinirSenha.safeParse(Object.fromEntries(formData));
  if (!dados.success) return errosDeValidacao(dados.error, formData);

  await db.usuario.update({
    where: { id: dados.data.usuarioId },
    data: { senhaHash: await gerarHashSenha(dados.data.senha) },
  });
  await encerrarSessoesDoUsuario(dados.data.usuarioId);
  return { sucesso: "Senha redefinida. O usuário precisará entrar novamente." };
}
