import "dotenv/config";
import { defineConfig } from "prisma/config";

// O banco é escolhido pela DATABASE_URL: "file:..." usa SQLite (desenvolvimento) e
// "postgres://" ou "postgresql://" usa PostgreSQL (produção). Cada um tem seu esquema
// e suas migrações; os modelos são os mesmos.
const url = process.env["DATABASE_URL"];
const postgres = /^postgres(ql)?:\/\//.test(url ?? "");
const pasta = postgres ? "prisma/postgresql" : "prisma";

export default defineConfig({
  schema: `${pasta}/schema.prisma`,
  migrations: {
    path: `${pasta}/migrations`,
    seed: "tsx prisma/seed.ts",
  },
  datasource: { url },
});
