import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

// O banco é escolhido pela DATABASE_URL (ver prisma.config.ts):
// "file:..." → SQLite (desenvolvimento); "postgres://" ou "postgresql://" → PostgreSQL (produção).
// O client gerado precisa ser do mesmo banco: o "prisma generate" usa o esquema certo
// porque lê a mesma DATABASE_URL.

export function ehPostgres(url: string): boolean {
  return /^postgres(ql)?:\/\//.test(url);
}

export function criarAdaptador(url: string | undefined) {
  if (!url) throw new Error("Defina DATABASE_URL (veja .env.example).");
  return ehPostgres(url) ? new PrismaPg({ connectionString: url }) : new PrismaBetterSqlite3({ url });
}
