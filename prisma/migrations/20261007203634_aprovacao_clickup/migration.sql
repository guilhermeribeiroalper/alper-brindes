-- AlterTable
ALTER TABLE "RespostaCotacao" ADD COLUMN "clickupEnviandoDesde" DATETIME;
ALTER TABLE "RespostaCotacao" ADD COLUMN "clickupErro" TEXT;
ALTER TABLE "RespostaCotacao" ADD COLUMN "clickupTaskId" TEXT;
ALTER TABLE "RespostaCotacao" ADD COLUMN "clickupTaskUrl" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SolicitacaoCotacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitanteId" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "dataNecessaria" DATETIME,
    "justificativa" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "enviadaEm" DATETIME,
    "canceladaEm" DATETIME,
    "canceladaPorId" TEXT,
    "motivoCancelamento" TEXT,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" DATETIME NOT NULL,
    CONSTRAINT "SolicitacaoCotacao_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitacaoCotacao_canceladaPorId_fkey" FOREIGN KEY ("canceladaPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SolicitacaoCotacao" ("atualizadaEm", "canceladaEm", "criadaEm", "dataNecessaria", "departamento", "enviadaEm", "id", "justificativa", "solicitanteId", "status") SELECT "atualizadaEm", "canceladaEm", "criadaEm", "dataNecessaria", "departamento", "enviadaEm", "id", "justificativa", "solicitanteId", "status" FROM "SolicitacaoCotacao";
DROP TABLE "SolicitacaoCotacao";
ALTER TABLE "new_SolicitacaoCotacao" RENAME TO "SolicitacaoCotacao";
CREATE INDEX "SolicitacaoCotacao_solicitanteId_status_idx" ON "SolicitacaoCotacao"("solicitanteId", "status");
CREATE INDEX "SolicitacaoCotacao_status_idx" ON "SolicitacaoCotacao"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Dados: o status RESPONDIDA foi substituído por APROVADA (a resposta do admin passou a ser a aprovação).
UPDATE "SolicitacaoCotacao" SET "status" = 'APROVADA' WHERE "status" = 'RESPONDIDA';
