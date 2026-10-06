# Suposições — Catálogo de Brindes (MVP)

Registro das suposições feitas onde o escopo não definia o comportamento.
Status: **PROPOSTA** = aguardando confirmação · **CONFIRMADA** · **ALTERADA**.

| # | Tema | Suposição | Status |
|---|------|-----------|--------|
| S1 | Faixas por fornecedor | Para uma quantidade Q, de cada fornecedor vale só a faixa com a **maior `quantidadeMinima` ≤ Q**. A estimativa vai do menor ao maior total entre os fornecedores elegíveis. | CONFIRMADA |
| S2 | Prazo na estimativa | O prazo aparece como intervalo (menor–maior `prazoEntregaDias` entre as opções elegíveis). | CONFIRMADA |
| S3 | Preço "ativo" | Adiciona-se o campo `ativo` em `PrecoFornecedor`. Um preço é elegível quando o preço, o produto e o fornecedor estão ativos e `validadeEstimativa` ≥ hoje (data local America/Sao_Paulo, inclusive). | CONFIRMADA |
| S4 | Faixa de referência no card | O card mostra o valor **unitário** de referência ("a partir de R$ X/un" até R$ Y/un), considerando todos os preços elegíveis, sem filtrar por quantidade. Se não houver preço, mostra "Sob cotação". | CONFIRMADA |
| S5 | Carrinho | O carrinho é a própria `SolicitacaoCotacao` em status `RASCUNHO`, persistida no banco (uma por usuário). Ao enviar, ela passa para `ENVIADA` e as estimativas são congeladas. | CONFIRMADA |
| S6 | Item sem preço | Um item sem preço elegível pode ser adicionado; fica com estimativa vazia ("Requer cotação formal") e não entra no total estimado. | CONFIRMADA |
| S7 | Valores monetários | Valores guardados em **centavos (inteiro)** para ser exato e funcionar igual em SQLite e PostgreSQL. | CONFIRMADA |
| S8 | Exclusões | Produtos, fornecedores, preços e usuários não são excluídos fisicamente; são inativados (preserva histórico e solicitações antigas). | CONFIRMADA |
| S9 | Histórico de preço | `HistoricoPreco` registra a criação (valor anterior vazio) e toda alteração de `valorUnitario`. Alterações em outros campos não geram histórico. | CONFIRMADA |
| S10 | Cancelamento | Só o solicitante cancela (em RASCUNHO ou ENVIADA). O admin não cancela neste MVP. | CONFIRMADA |
| S11 | Imagem do produto | `imagemUrl` é uma URL digitada pelo admin; não há upload de arquivos no MVP. | CONFIRMADA |
| S12 | Categoria | Categoria é texto livre no produto, com sugestões das categorias já usadas (sem tabela própria). | CONFIRMADA |
| S13 | Departamento | O departamento da solicitação vem preenchido com o do usuário e pode ser editado no envio. | CONFIRMADA |
| S14 | ADMIN usa o catálogo | O ADMIN também pode usar catálogo, carrinho e solicitações, como um solicitante. | CONFIRMADA |
| S15 | Resposta | A resposta do admin traz só o valor total final (sem valor por item) e é única por solicitação. | CONFIRMADA |
| S16 | Autenticação | Sessão própria guardada no banco (cookie httpOnly com token aleatório; só o hash do token vai para o banco) e senha com bcrypt. Não usa Auth.js. | CONFIRMADA |
| S17 | Troca para PostgreSQL | O Prisma não aceita `provider` vindo de variável de ambiente. Para ir à produção, troca-se `provider = "sqlite"` por `"postgresql"` e geram-se as migrações de novo. O esquema evita recursos exclusivos de um dos bancos. | CONFIRMADA |
