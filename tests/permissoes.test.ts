import { describe, expect, it } from "vitest";
import {
  autorizar,
  ehDonoDaSolicitacao,
  podeAlterarUsuario,
  podeVerSolicitacao,
  type UsuarioSessao,
} from "@/lib/auth/permissoes";

const admin: UsuarioSessao = { id: "adm", nome: "Admin", email: "a@x", perfil: "ADMIN", departamento: "Compras" };
const solic: UsuarioSessao = { id: "sol", nome: "Sol", email: "s@x", perfil: "SOLICITANTE", departamento: "Marketing" };

describe("autorizar por perfil", () => {
  it("sem sessão: não autenticado", () => {
    expect(autorizar(null, "AUTENTICADO")).toEqual({ ok: false, motivo: "NAO_AUTENTICADO" });
    expect(autorizar(null, "ADMIN")).toEqual({ ok: false, motivo: "NAO_AUTENTICADO" });
  });

  it("SOLICITANTE acessa área autenticada mas não a de admin", () => {
    expect(autorizar(solic, "AUTENTICADO")).toEqual({ ok: true });
    expect(autorizar(solic, "ADMIN")).toEqual({ ok: false, motivo: "PROIBIDO" });
  });

  it("ADMIN acessa tudo", () => {
    expect(autorizar(admin, "AUTENTICADO")).toEqual({ ok: true });
    expect(autorizar(admin, "ADMIN")).toEqual({ ok: true });
  });
});

describe("acesso a solicitações", () => {
  const minha = { solicitanteId: "sol" };
  const deOutro = { solicitanteId: "xyz" };

  it("dono e admin veem; outro solicitante não", () => {
    expect(podeVerSolicitacao(solic, minha)).toBe(true);
    expect(podeVerSolicitacao(admin, deOutro)).toBe(true);
    expect(podeVerSolicitacao(solic, deOutro)).toBe(false);
    expect(podeVerSolicitacao(null, minha)).toBe(false);
  });

  it("só o dono é dono (admin não altera itens nem cancela pelo solicitante)", () => {
    expect(ehDonoDaSolicitacao(solic, minha)).toBe(true);
    expect(ehDonoDaSolicitacao(admin, minha)).toBe(false);
  });
});

describe("gestão de usuários", () => {
  it("admin não altera o próprio usuário", () => {
    expect(podeAlterarUsuario(admin, "adm")).toBe(false);
    expect(podeAlterarUsuario(admin, "sol")).toBe(true);
  });
});
