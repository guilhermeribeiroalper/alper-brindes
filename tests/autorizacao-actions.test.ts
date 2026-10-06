// Autorização verificada no servidor: chama cada Server Action diretamente (como faria
// um POST forjado) com sessões de perfis diferentes. O banco é substituído por um objeto
// que falha a qualquer acesso, provando que a checagem acontece ANTES de ler ou gravar.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioSessao } from "@/lib/auth/permissoes";

const estado = vi.hoisted(() => ({ usuario: null as UsuarioSessao | null, acessosAoBanco: [] as string[] }));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));
vi.mock("@/lib/auth/sessao", () => ({
  obterUsuarioAtual: async () => estado.usuario,
  criarSessao: vi.fn(),
  encerrarSessao: vi.fn(),
  encerrarSessoesDoUsuario: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: new Proxy(
    {},
    {
      get(_alvo, prop) {
        estado.acessosAoBanco.push(String(prop));
        throw new Error(`BANCO:${String(prop)}`);
      },
    },
  ),
}));

import * as auth from "@/actions/auth";
import * as carrinho from "@/actions/carrinho";
import * as catalogo from "@/actions/catalogo";
import * as fornecedores from "@/actions/fornecedores";
import * as precos from "@/actions/precos";
import * as produtos from "@/actions/produtos";
import * as solicitacoes from "@/actions/solicitacoes";
import * as usuarios from "@/actions/usuarios";
import { exigirAdmin, exigirUsuario } from "@/lib/auth/guards";

type Acao = (...args: unknown[]) => Promise<unknown>;
const MODULOS = { auth, carrinho, catalogo, fornecedores, precos, produtos, solicitacoes, usuarios } as const;

// Toda action nova precisa ser classificada aqui (o teste "classificação" falha se não for).
const PUBLICAS = ["auth.entrar", "auth.sair"];
const AUTENTICADAS = [
  "carrinho.adicionarAoCarrinho",
  "carrinho.alterarQuantidadeItem",
  "carrinho.removerItem",
  "catalogo.simularEstimativa",
  "solicitacoes.enviarSolicitacao",
  "solicitacoes.cancelarSolicitacao",
];
const SOMENTE_ADMIN = [
  "fornecedores.salvarFornecedor",
  "fornecedores.alterarAtivoFornecedor",
  "produtos.salvarProduto",
  "produtos.alterarAtivoProduto",
  "precos.salvarPreco",
  "precos.alterarAtivoPreco",
  "solicitacoes.iniciarAnalise",
  "solicitacoes.responderSolicitacao",
  "usuarios.criarUsuario",
  "usuarios.alterarAtivoUsuario",
  "usuarios.alterarPerfilUsuario",
  "usuarios.redefinirSenha",
];

function acao(nome: string): Acao {
  const [modulo, funcao] = nome.split(".") as [keyof typeof MODULOS, string];
  return (MODULOS[modulo] as Record<string, Acao>)[funcao];
}

/** Chama a action com um FormData vazio, no formato (formData) ou (estado, formData). */
async function chamar(nome: string): Promise<string> {
  const fn = acao(nome);
  const fd = new FormData();
  try {
    await (fn.length >= 2 ? fn(undefined, fd) : fn(fd));
    return "RETORNOU";
  } catch (erro) {
    return (erro as Error).message;
  }
}

const ADMIN: UsuarioSessao = { id: "adm", nome: "Admin", email: "a@x", perfil: "ADMIN", departamento: "Compras" };
const SOLICITANTE: UsuarioSessao = { id: "sol", nome: "Sol", email: "s@x", perfil: "SOLICITANTE", departamento: "Mkt" };

beforeEach(() => {
  estado.usuario = null;
  estado.acessosAoBanco = [];
});

describe("classificação", () => {
  it("toda Server Action exportada está classificada por perfil", () => {
    const exportadas = Object.entries(MODULOS).flatMap(([modulo, exp]) =>
      Object.entries(exp)
        .filter(([, v]) => typeof v === "function")
        .map(([nome]) => `${modulo}.${nome}`),
    );
    expect(exportadas.sort()).toEqual([...PUBLICAS, ...AUTENTICADAS, ...SOMENTE_ADMIN].sort());
  });
});

describe("sem sessão", () => {
  it.each([...AUTENTICADAS, ...SOMENTE_ADMIN])("%s redireciona para /login sem tocar no banco", async (nome) => {
    expect(await chamar(nome)).toBe("REDIRECT:/login");
    expect(estado.acessosAoBanco).toEqual([]);
  });
});

describe("perfil SOLICITANTE", () => {
  it.each(SOMENTE_ADMIN)("%s é negada sem tocar no banco", async (nome) => {
    estado.usuario = SOLICITANTE;
    expect(await chamar(nome)).toBe("REDIRECT:/acesso-negado");
    expect(estado.acessosAoBanco).toEqual([]);
  });

  it.each(AUTENTICADAS)("%s passa pela verificação de perfil", async (nome) => {
    estado.usuario = SOLICITANTE;
    expect(await chamar(nome)).not.toMatch(/^REDIRECT:\/(login|acesso-negado)$/);
  });
});

describe("perfil ADMIN", () => {
  it.each([...AUTENTICADAS, ...SOMENTE_ADMIN])("%s passa pela verificação de perfil", async (nome) => {
    estado.usuario = ADMIN;
    expect(await chamar(nome)).not.toMatch(/^REDIRECT:\/(login|acesso-negado)$/);
  });
});

describe("guards", () => {
  it("exigirUsuario", async () => {
    await expect(exigirUsuario()).rejects.toThrow("REDIRECT:/login");
    estado.usuario = SOLICITANTE;
    await expect(exigirUsuario()).resolves.toEqual(SOLICITANTE);
  });

  it("exigirAdmin", async () => {
    await expect(exigirAdmin()).rejects.toThrow("REDIRECT:/login");
    estado.usuario = SOLICITANTE;
    await expect(exigirAdmin()).rejects.toThrow("REDIRECT:/acesso-negado");
    estado.usuario = ADMIN;
    await expect(exigirAdmin()).resolves.toEqual(ADMIN);
  });
});
