import { describe, expect, it } from "vitest";
import { adminPodeCancelar, podeCancelar, validarTransicao, type StatusSolicitacao } from "@/lib/regras/status";

const dono = { perfil: "SOLICITANTE", ehDono: true } as const;
const outro = { perfil: "SOLICITANTE", ehDono: false } as const;
const admin = { perfil: "ADMIN", ehDono: false } as const;
const TODOS: StatusSolicitacao[] = ["RASCUNHO", "ENVIADA", "EM_ANALISE", "APROVADA", "CANCELADA"];

describe("fluxo de status", () => {
  it.each([
    ["RASCUNHO", "ENVIADA", dono],
    ["ENVIADA", "EM_ANALISE", admin],
    ["EM_ANALISE", "APROVADA", admin],
    ["RASCUNHO", "CANCELADA", dono],
    ["ENVIADA", "CANCELADA", dono],
    ["ENVIADA", "CANCELADA", admin],
    ["EM_ANALISE", "CANCELADA", admin],
  ] as const)("%s → %s é permitido", (de, para, ator) => {
    expect(validarTransicao(de, para, ator)).toEqual({ ok: true });
  });

  it.each([
    ["RASCUNHO", "EM_ANALISE"],
    ["RASCUNHO", "APROVADA"],
    ["ENVIADA", "APROVADA"],
    ["ENVIADA", "RASCUNHO"],
    ["EM_ANALISE", "ENVIADA"],
    ["APROVADA", "CANCELADA"],
    ["APROVADA", "EM_ANALISE"],
    ["CANCELADA", "ENVIADA"],
    ["CANCELADA", "APROVADA"],
  ] as const)("%s → %s é bloqueado para todos", (de, para) => {
    expect(validarTransicao(de, para, admin).ok).toBe(false);
    expect(validarTransicao(de, para, dono).ok).toBe(false);
  });

  it("o solicitante cancela só em RASCUNHO ou ENVIADA", () => {
    expect(TODOS.filter(podeCancelar)).toEqual(["RASCUNHO", "ENVIADA"]);
  });

  it("o admin cancela só em ENVIADA ou EM_ANALISE", () => {
    expect(TODOS.filter(adminPodeCancelar)).toEqual(["ENVIADA", "EM_ANALISE"]);
  });
});

describe("quem executa cada transição", () => {
  it("só o dono envia; só o dono ou o admin cancelam", () => {
    expect(validarTransicao("RASCUNHO", "ENVIADA", outro).ok).toBe(false);
    expect(validarTransicao("RASCUNHO", "ENVIADA", admin).ok).toBe(false);
    expect(validarTransicao("ENVIADA", "CANCELADA", outro).ok).toBe(false);
    expect(validarTransicao("RASCUNHO", "CANCELADA", admin).ok).toBe(false);
  });

  it("só o admin analisa, aprova e cancela em análise", () => {
    expect(validarTransicao("ENVIADA", "EM_ANALISE", dono).ok).toBe(false);
    expect(validarTransicao("EM_ANALISE", "APROVADA", dono).ok).toBe(false);
    expect(validarTransicao("EM_ANALISE", "CANCELADA", dono).ok).toBe(false);
  });
});
