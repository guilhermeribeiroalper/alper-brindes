import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { criarAdaptador } from "@/lib/adaptador-banco";

function criarCliente() {
  return new PrismaClient({ adapter: criarAdaptador(process.env.DATABASE_URL) });
}

// Reaproveita a instância entre recarregamentos do servidor de desenvolvimento.
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalParaPrisma.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = db;
