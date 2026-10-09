-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'SOLICITANTE');

-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('RASCUNHO', 'ENVIADA', 'EM_ANALISE', 'APROVADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'SOLICITANTE',
    "departamento" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "contatoNome" TEXT,
    "contatoEmail" TEXT,
    "contatoTelefone" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "imagemUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrecoFornecedor" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "valorUnitarioCentavos" INTEGER NOT NULL,
    "quantidadeMinima" INTEGER NOT NULL DEFAULT 1,
    "prazoEntregaDias" INTEGER NOT NULL,
    "validadeEstimativa" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrecoFornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoPreco" (
    "id" TEXT NOT NULL,
    "precoFornecedorId" TEXT NOT NULL,
    "valorAnteriorCentavos" INTEGER,
    "valorNovoCentavos" INTEGER NOT NULL,
    "alteradoPorId" TEXT NOT NULL,
    "alteradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoPreco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitacaoCotacao" (
    "id" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "dataNecessaria" TIMESTAMP(3),
    "justificativa" TEXT,
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'RASCUNHO',
    "enviadaEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "canceladaPorId" TEXT,
    "motivoCancelamento" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitacaoCotacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemSolicitacao" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "estimativaMinimaCentavos" INTEGER,
    "estimativaMaximaCentavos" INTEGER,
    "prazoMinDias" INTEGER,
    "prazoMaxDias" INTEGER,

    CONSTRAINT "ItemSolicitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaCotacao" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "valorTotalFinalCentavos" INTEGER NOT NULL,
    "fornecedorEscolhidoId" TEXT,
    "prazoEntregaDias" INTEGER NOT NULL,
    "observacoes" TEXT,
    "respondidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clickupTaskId" TEXT,
    "clickupTaskUrl" TEXT,
    "clickupErro" TEXT,
    "clickupEnviandoDesde" TIMESTAMP(3),

    CONSTRAINT "RespostaCotacao_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecoFornecedor" ADD CONSTRAINT "PrecoFornecedor_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecoFornecedor" ADD CONSTRAINT "PrecoFornecedor_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoPreco" ADD CONSTRAINT "HistoricoPreco_precoFornecedorId_fkey" FOREIGN KEY ("precoFornecedorId") REFERENCES "PrecoFornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoPreco" ADD CONSTRAINT "HistoricoPreco_alteradoPorId_fkey" FOREIGN KEY ("alteradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoCotacao" ADD CONSTRAINT "SolicitacaoCotacao_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoCotacao" ADD CONSTRAINT "SolicitacaoCotacao_canceladaPorId_fkey" FOREIGN KEY ("canceladaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemSolicitacao" ADD CONSTRAINT "ItemSolicitacao_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoCotacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemSolicitacao" ADD CONSTRAINT "ItemSolicitacao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaCotacao" ADD CONSTRAINT "RespostaCotacao_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoCotacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaCotacao" ADD CONSTRAINT "RespostaCotacao_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaCotacao" ADD CONSTRAINT "RespostaCotacao_fornecedorEscolhidoId_fkey" FOREIGN KEY ("fornecedorEscolhidoId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
