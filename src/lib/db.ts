import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

function criarCliente() {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "" });
  return new PrismaClient({ adapter });
}

// Reaproveita a instância entre recarregamentos do servidor de desenvolvimento.
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalParaPrisma.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = db;
