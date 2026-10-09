// O projeto tem dois esquemas Prisma (SQLite no desenvolvimento, PostgreSQL em produção).
// Os modelos precisam ser idênticos: só o provider e o caminho do client gerado mudam.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ehPostgres } from "@/lib/adaptador-banco";

function modelos(caminho: string): string {
  return readFileSync(join(__dirname, "..", caminho), "utf8")
    .replace(/\r\n/g, "\n")
    .replace(/^\/\/.*$/gm, "") // comentários de linha
    .replace(/generator client \{[\s\S]*?\}/, "")
    .replace(/datasource db \{[\s\S]*?\}/, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

describe("esquemas Prisma", () => {
  it("SQLite e PostgreSQL têm os mesmos modelos", () => {
    expect(modelos("prisma/postgresql/schema.prisma")).toBe(modelos("prisma/schema.prisma"));
  });

  it("cada esquema usa o provider certo", () => {
    expect(readFileSync(join(__dirname, "..", "prisma/schema.prisma"), "utf8")).toMatch(/provider = "sqlite"/);
    expect(readFileSync(join(__dirname, "..", "prisma/postgresql/schema.prisma"), "utf8")).toMatch(
      /provider = "postgresql"/,
    );
  });
});

describe("escolha do banco pela DATABASE_URL", () => {
  it.each([
    ["postgresql://u:s@host/db", true],
    ["postgres://u:s@host:5432/db", true],
    ["file:./prisma/dev.db", false],
    ["", false],
  ])("%s → PostgreSQL: %s", (url, esperado) => {
    expect(ehPostgres(url)).toBe(esperado);
  });
});
