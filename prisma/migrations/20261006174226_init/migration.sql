-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'SOLICITANTE',
    "departamento" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiraEm" DATETIME NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "contatoNome" TEXT,
    "contatoEmail" TEXT,
    "contatoTelefone" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "imagemUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PrecoFornecedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "produtoId" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "valorUnitarioCentavos" INTEGER NOT NULL,
    "quantidadeMinima" INTEGER NOT NULL DEFAULT 1,
    "prazoEntregaDias" INTEGER NOT NULL,
    "validadeEstimativa" DATETIME NOT NULL,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "PrecoFornecedor_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrecoFornecedor_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoricoPreco" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "precoFornecedorId" TEXT NOT NULL,
    "valorAnteriorCentavos" INTEGER,
    "valorNovoCentavos" INTEGER NOT NULL,
    "alteradoPorId" TEXT NOT NULL,
    "alteradoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoricoPreco_precoFornecedorId_fkey" FOREIGN KEY ("precoFornecedorId") REFERENCES "PrecoFornecedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HistoricoPreco_alteradoPorId_fkey" FOREIGN KEY ("alteradoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SolicitacaoCotacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitanteId" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "dataNecessaria" DATETIME,
    "justificativa" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "enviadaEm" DATETIME,
    "canceladaEm" DATETIME,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" DATETIME NOT NULL,
    CONSTRAINT "SolicitacaoCotacao_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemSolicitacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitacaoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "estimativaMinimaCentavos" INTEGER,
    "estimativaMaximaCentavos" INTEGER,
    "prazoMinDias" INTEGER,
    "prazoMaxDias" INTEGER,
    CONSTRAINT "ItemSolicitacao_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoCotacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemSolicitacao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RespostaCotacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitacaoId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "valorTotalFinalCentavos" INTEGER NOT NULL,
    "fornecedorEscolhidoId" TEXT,
    "prazoEntregaDias" INTEGER NOT NULL,
    "observacoes" TEXT,
    "respondidaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RespostaCotacao_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoCotacao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RespostaCotacao_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RespostaCotacao_fornecedorEscolhidoId_fkey" FOREIGN KEY ("fornecedorEscolhidoId") REFERENCES "Fornecedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_tokenHash_key" ON "Sessao"("tokenHash");

-- CreateIndex
CREATE INDEX "Sessao_usuarioId_idx" ON "Sessao"("usuarioId");

-- CreateIndex
CREATE INDEX "Produto_categoria_idx" ON "Produto"("categoria");

-- CreateIndex
CREATE INDEX "PrecoFornecedor_produtoId_idx" ON "PrecoFornecedor"("produtoId");

-- CreateIndex
CREATE INDEX "PrecoFornecedor_fornecedorId_idx" ON "PrecoFornecedor"("fornecedorId");

-- CreateIndex
CREATE INDEX "HistoricoPreco_precoFornecedorId_idx" ON "HistoricoPreco"("precoFornecedorId");

-- CreateIndex
CREATE INDEX "SolicitacaoCotacao_solicitanteId_status_idx" ON "SolicitacaoCotacao"("solicitanteId", "status");

-- CreateIndex
CREATE INDEX "SolicitacaoCotacao_status_idx" ON "SolicitacaoCotacao"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ItemSolicitacao_solicitacaoId_produtoId_key" ON "ItemSolicitacao"("solicitacaoId", "produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaCotacao_solicitacaoId_key" ON "RespostaCotacao"("solicitacaoId");
