import { describe, expect, it } from "vitest";
import { podeCancelar, validarTransicao, type StatusSolicitacao } from "@/lib/regras/status";

const dono = { perfil: "SOLICITANTE", ehDono: true } as const;
const outro = { perfil: "SOLICITANTE", ehDono: false } as const;
const admin = { perfil: "ADMIN", ehDono: false } as const;

describe("fluxo de status", () => {
  it.each([
    ["RASCUNHO", "ENVIADA", dono],
    ["ENVIADA", "EM_ANALISE", admin],
    ["EM_ANALISE", "RESPONDIDA", admin],
    ["RASCUNHO", "CANCELADA", dono],
    ["ENVIADA", "CANCELADA", dono],
  ] as const)("%s → %s é permitido", (de, para, ator) => {
    expect(validarTransicao(de, para, ator)).toEqual({ ok: true });
  });

  it.each([
    ["RASCUNHO", "EM_ANALISE"],
    ["RASCUNHO", "RESPONDIDA"],
    ["ENVIADA", "RESPONDIDA"],
    ["ENVIADA", "RASCUNHO"],
    ["EM_ANALISE", "CANCELADA"],
    ["EM_ANALISE", "ENVIADA"],
    ["RESPONDIDA", "CANCELADA"],
    ["CANCELADA", "ENVIADA"],
  ] as const)("%s → %s é bloqueado", (de, para) => {
    expect(validarTransicao(de, para, admin).ok).toBe(false);
    expect(validarTransicao(de, para, dono).ok).toBe(false);
  });

  it("cancelar só enquanto RASCUNHO ou ENVIADA", () => {
    const todos: StatusSolicitacao[] = ["RASCUNHO", "ENVIADA", "EM_ANALISE", "RESPONDIDA", "CANCELADA"];
    expect(todos.filter(podeCancelar)).toEqual(["RASCUNHO", "ENVIADA"]);
  });
});

describe("quem executa cada transição", () => {
  it("só o dono envia e cancela", () => {
    expect(validarTransicao("RASCUNHO", "ENVIADA", outro).ok).toBe(false);
    expect(validarTransicao("ENVIADA", "CANCELADA", outro).ok).toBe(false);
    expect(validarTransicao("ENVIADA", "CANCELADA", admin).ok).toBe(false);
  });

  it("só o admin analisa e responde", () => {
    expect(validarTransicao("ENVIADA", "EM_ANALISE", dono).ok).toBe(false);
    expect(validarTransicao("EM_ANALISE", "RESPONDIDA", dono).ok).toBe(false);
  });
});
