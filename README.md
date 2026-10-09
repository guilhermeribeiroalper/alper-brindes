# Catálogo de Brindes · Alper

Aplicação web interna para consultar brindes, obter uma estimativa de preço imediata e enviar solicitações formais de cotação ao administrador.

- **ADMIN** cadastra produtos, fornecedores e preços por fornecedor (com faixas de quantidade, prazo e validade), aprova ou cancela as cotações (a aprovação cria uma tarefa no ClickUp) e gerencia usuários.
- **SOLICITANTE** consulta o catálogo, simula estimativas, monta uma lista (carrinho) e acompanha as próprias solicitações. **Nunca vê fornecedores**, só a faixa de preço.

## Stack

| Item | Versão |
|---|---|
| Next.js (App Router, Turbopack) + React | 16.3 / 19.2 |
| TypeScript | 5 |
| Prisma ORM (adaptador `better-sqlite3`) | 7.10 |
| Banco | SQLite (desenvolvimento) · PostgreSQL (produção, ver abaixo) |
| Tailwind CSS | 4 |
| Zod (validação) | 4 |
| bcryptjs (hash de senha) | 3 |
| Vitest (testes) | 5 |

Autenticação própria: e-mail e senha, sessão guardada no banco e cookie `httpOnly` com token aleatório (no banco fica só o hash SHA-256 do token).

## Pré-requisitos

- Node.js **20.9 ou superior** (testado com Node 24)
- npm. No npm 11 ou superior, os scripts de instalação já liberados estão em `allowScripts` no `package.json` (Prisma, better-sqlite3, esbuild).

## Instalação

```bash
npm install                 # também roda "prisma generate"
cp .env.example .env        # no Windows (PowerShell): Copy-Item .env.example .env
```

Edite o `.env` e defina **senhas fortes** em `SEED_ADMIN_SENHA` e `SEED_SOLICITANTE_SENHA`. O arquivo `.env` não vai para o repositório.

```bash
npm run db:migrate          # cria o banco SQLite (prisma/dev.db) e aplica as migrações
npm run db:seed             # cria o admin, o solicitante de exemplo, 2 fornecedores e 5 produtos
npm run dev                 # http://localhost:3000
```

Entre com o e-mail e a senha definidos no `.env`.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | `file:./prisma/dev.db` usa SQLite (desenvolvimento). `postgresql://...` usa PostgreSQL (produção); veja a seção do Render |
| `SEED_ADMIN_EMAIL` | para o seed | E-mail do admin inicial |
| `SEED_ADMIN_SENHA` | para o seed | Senha do admin inicial (mín. 8 caracteres recomendada) |
| `SEED_ADMIN_NOME` | não | Nome do admin inicial (padrão "Administrador") |
| `SEED_SOLICITANTE_EMAIL` / `SEED_SOLICITANTE_SENHA` | não | Solicitante de exemplo. Se a senha ficar vazia, ele não é criado |
| `SEED_PRODUTOS_EXEMPLO` | não | `false` impede o seed de criar fornecedores e produtos de exemplo (padrão: cria, se o catálogo estiver vazio) |
| `CLICKUP_API_TOKEN` | não | Token pessoal do ClickUp (começa com `pk_`). Sem ele, a aprovação funciona, mas a tarefa não é criada |
| `CLICKUP_LIST_ID` | não | ID da lista do ClickUp onde as tarefas são criadas |
| `CLICKUP_API_URL` | não | Só para testes; padrão `https://api.clickup.com/api/v2` |

O seed pode ser executado várias vezes: não sobrescreve usuários existentes e só cria os produtos de exemplo se o catálogo estiver vazio.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção. O `npm start` aplica migrações pendentes e roda o seed antes de subir (`npm run start:somente-servidor` sobe sem isso) |
| `npm test` | Testes automatizados (Vitest) |
| `npm run typecheck` / `npm run lint` | Checagem de tipos e lint |
| `npm run db:migrate` | Cria uma migração após mudar o `schema.prisma` e regenera o client |
| `npm run db:deploy` | Aplica migrações pendentes (produção) |
| `npm run db:seed` | Popula o banco |
| `npm run db:reset` | **Apaga todos os dados** do banco de desenvolvimento, reaplica as migrações e roda o seed |
| `npm run db:studio` | Abre o Prisma Studio |

## Testes

```bash
npm test
```

| Arquivo | Cobre |
|---|---|
| `tests/estimativa.test.ts` | Faixas por quantidade, quantidade mínima, validade vencida (e o limite do dia), sem preço aplicável, preços e fornecedores inativos, produto inativo, quantidade inválida, faixa de referência do catálogo, total da lista e ausência de dados de fornecedor no resultado |
| `tests/autorizacao-actions.test.ts` | Chama **todas** as Server Actions sem sessão, como SOLICITANTE e como ADMIN. O banco é substituído por um objeto que falha a qualquer acesso, o que prova que a permissão é verificada antes de ler ou gravar. Toda action nova precisa ser classificada no teste |
| `tests/autorizacao-paginas.test.ts` | Toda página da área logada chama o guard no próprio arquivo; páginas de `/admin` exigem ADMIN |
| `tests/permissoes.test.ts` | Regras de perfil e acesso a solicitações |
| `tests/status.test.ts` | Transições de status permitidas e bloqueadas, e quem executa cada uma |
| `tests/formatacao-e-datas.test.ts` | BRL, dd/mm/aaaa, data de "hoje" no fuso de São Paulo e busca sem acento |

## Regras de negócio implementadas

- **Estimativa imediata**: considera preços ativos, de fornecedores ativos, com validade maior ou igual a hoje (fuso America/Sao_Paulo) e quantidade mínima menor ou igual à quantidade pedida. De cada fornecedor vale a faixa de maior quantidade mínima atendida. Mostra do menor ao maior total (quantidade × valor unitário) e o intervalo de prazo. Sem preço aplicável, a tela pede uma cotação formal.
- Toda estimativa traz o aviso "Valor estimado, sujeito a confirmação pelo administrador."
- O cálculo é feito **no servidor**: o navegador do solicitante recebe só os totais agregados, nunca os preços por fornecedor.
- **Carrinho** = solicitação em `RASCUNHO`. Ao enviar, a estimativa de cada item fica congelada.
- **Status**: RASCUNHO → ENVIADA → EM_ANALISE → APROVADA. O solicitante cancela em RASCUNHO ou ENVIADA; o admin cancela, com motivo, em ENVIADA ou EM_ANALISE. As transições são protegidas contra concorrência (a gravação só acontece se o status ainda for o esperado).
- **Aprovação e ClickUp**: o admin inicia a análise e aprova, informando valor total final, fornecedor, prazo e observações. Na aprovação, o sistema cria uma tarefa no ClickUp com os brindes (quantidades e estimativas), o fornecedor, o valor e o prazo, os dados do solicitante e a justificativa. A data necessária vira o prazo da tarefa. Se o ClickUp falhar ou não estiver configurado, a aprovação é salva mesmo assim, o erro aparece na solicitação e o admin pode reenviar. Uma trava impede tarefas duplicadas.
- Produtos e fornecedores são **inativados**, nunca excluídos. Os inativos saem das estimativas, mas continuam nas solicitações antigas.
- Toda mudança de valor unitário (e o cadastro inicial) gera um registro em `HistoricoPreco`.
- Valores monetários são guardados em **centavos (inteiros)**.

As suposições feitas onde o escopo não definia o comportamento estão em [docs/SUPOSICOES.md](docs/SUPOSICOES.md).

## Identidade visual

A interface segue o **Alper Design System** (tokens e tipografia). Os tokens estão em `src/app/globals.css`, com os mesmos nomes do `tokens.json` do design system. Exemplos: `brand-navy`, `surface`, `on-surface`, `accent`, `radius-md`, `shadow-sm`. Os componentes base ficam em `src/components/ui.tsx`.

- **Tipografia:** Montserrat, carregada pelo `next/font`. Pluto, a fonte de títulos, é proprietária e não vem incluída. Se for instalada, entra antes da Montserrat na pilha `font-display`.
- **Grafismo:** o reticulado de linhas diagonais do design system não é usado na interface (decisão de produto). Restam só os traços lime curtos sob os títulos.
- **Imagens ilustrativas:** produto sem foto cadastrada mostra uma de seis imagens padrão (`public/imagens/produtos/`, todas CC0), escolhida pelo id do produto. A escolha é estável e a imagem leva o selo "Imagem ilustrativa". Para mudar a lista, edite `src/lib/imagens.ts`. Os créditos estão em [docs/CREDITOS-IMAGENS.md](docs/CREDITOS-IMAGENS.md).
- **Foto do login:** `public/imagens/login-presentes.jpg`, "Brown gift box with red ribbon and bow", de Shixart1985, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Brown_gift_box_with_red_ribbon_and_bow.jpg). A licença é [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) e exige o crédito, que aparece na própria tela. A foto não recebe o overlay de grafismo que o design system pede para fotografias: foi uma escolha de layout. Para trocar, substitua o arquivo e atualize o crédito em `src/app/login/page.tsx`.
- **Logotipo:** versão branca oficial (`public/Logo-Alper-white.avif`, com a tagline), no componente `LogoAlper` (`src/components/logo-alper.tsx`). Aparece no cabeçalho e no login, sempre sobre a cor da marca, com 100px de largura (por decisão de produto, abaixo do mínimo de 200px do design system). É servida sem otimização porque o otimizador do Next converteria para JPEG e perderia a transparência. No rodapé, que tem fundo claro, a marca fica em texto até haver uma versão colorida do logo.
- **Contraste (AA):** alguns pares de tokens não chegam a 4,5:1 em texto pequeno. Por isso:
  - os botões principais usam `brand-navy` (branco sobre `interactive` dá só 4,0:1);
  - os links usam `interactive-hover` (5,4:1);
  - o anel de foco é navy sobre fundo claro e lime só sobre a cor da marca;
  - textos de alerta ficam em navy, com o laranja apenas no ponto ou na borda.

  Atenção: o `on-surface-muted` (#787878) tem 4,4:1 sobre branco e foi mantido como está no design system.
- Só existe tema claro. O design system define também um tema escuro, que ainda não foi aplicado.

## Segurança

- A permissão é verificada no servidor no início de **toda página e toda Server Action** (`exigirUsuario()` / `exigirAdmin()` em `src/lib/auth/guards.ts`), e não só escondendo botões.
- As consultas da visão do solicitante (`src/lib/consultas/catalogo.ts`) nunca devolvem fornecedores.
- Senhas com bcrypt (custo 12). O login não revela se o e-mail existe.
- Sessão de 12 horas. Desativar um usuário ou redefinir a senha dele encerra as sessões ativas.
- Em produção (`NODE_ENV=production`) o cookie de sessão é `Secure`: sirva a aplicação via **HTTPS**.

## Estrutura

```
prisma/
  schema.prisma          modelo de dados (SQLite, desenvolvimento)
  postgresql/            esquema e migrações do PostgreSQL (produção)
  migrations/            migrações versionadas
  seed.ts                dados iniciais (credenciais vêm do .env)
src/
  actions/               Server Actions (cada uma começa pelo guard)
  app/
    login/               tela de login
    (app)/               área logada (layout com navegação)
      catalogo/          catálogo e detalhe com simulador
      minha-solicitacao/ carrinho e envio formal
      solicitacoes/      minhas solicitações e detalhe
      admin/             painel, fila, produtos, preços, fornecedores, usuários
  components/            componentes de interface
  lib/
    auth/                senha, sessão, guards e regras de permissão
    consultas/           consultas reutilizáveis (visão do solicitante)
    regras/              regras de negócio puras (estimativa, status)
    validacao/           esquemas Zod
    datas.ts, formatacao.ts
tests/                   testes automatizados
docs/SUPOSICOES.md       suposições registradas
```

## Produção com PostgreSQL (Render)

O banco é escolhido pela `DATABASE_URL`:

| `DATABASE_URL` | Banco | Esquema e migrações |
|---|---|---|
| `file:./prisma/dev.db` | SQLite (desenvolvimento) | `prisma/schema.prisma`, `prisma/migrations/` |
| `postgresql://...` | PostgreSQL (produção) | `prisma/postgresql/schema.prisma`, `prisma/postgresql/migrations/` |

Os dois esquemas têm os mesmos modelos (o teste `tests/esquemas-prisma.test.ts` garante isso). Ao mudar o modelo de dados:
1. Edite `prisma/schema.prisma` e copie a mudança para `prisma/postgresql/schema.prisma`.
2. `npm run db:migrate` gera a migração do SQLite.
3. Gere a migração do PostgreSQL sem precisar de um servidor Postgres:
   ```bash
   npx prisma migrate diff --from-migrations prisma/postgresql/migrations --to-schema prisma/postgresql/schema.prisma --script -o prisma/postgresql/migrations/<data>_<nome>/migration.sql
   ```

### Deploy no Render

1. Crie um **PostgreSQL** no Render e copie a **Internal Database URL** (só funciona dentro do Render).
2. No **Web Service**:
   - **Build Command:** `npm ci && npm run build` (o `npm ci` já gera o client do Prisma para PostgreSQL)
   - **Start Command:** `npm start`. O próprio `npm start` aplica as migrações pendentes (`prisma migrate deploy`), roda o seed e só então sobe o servidor. Não é preciso usar o Shell do Render: com a Internal Database URL, o banco só é acessível com o serviço rodando, não durante o build.
   - **Environment:**
     - `DATABASE_URL` = a Internal Database URL
     - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_SENHA`, `SEED_ADMIN_NOME` (admin inicial; o seed não altera usuários existentes)
     - opcionalmente `SEED_SOLICITANTE_EMAIL` e `SEED_SOLICITANTE_SENHA`
     - `SEED_PRODUTOS_EXEMPLO=false` para não criar o catálogo de exemplo
     - `CLICKUP_API_TOKEN` e `CLICKUP_LIST_ID`, se for usar a integração
3. **Não** defina `NODE_ENV=production` nas variáveis do Render. O build precisa das dependências de desenvolvimento (Prisma CLI e tsx), e o `npm start` já roda em modo produção.
4. O Render serve via HTTPS, que é necessário para o cookie de sessão (`Secure` em produção).

O `migrate deploy` só aplica migrações pendentes, e o seed roda a cada inicialização sem duplicar nada. Se faltarem as variáveis do admin, ele só avisa no log e não impede o servidor de subir: só cria usuários que não existem e só cria os produtos de exemplo se o catálogo estiver vazio. Para não criar o catálogo de exemplo em produção, defina `SEED_PRODUTOS_EXEMPLO=false`.

## Fora do escopo do MVP (e onde encaixar depois)

| Evolução | Ponto de extensão |
|---|---|
| E-mail e notificações | Depois das transições em `src/actions/solicitacoes.ts` (envio, início da análise, aprovação, cancelamento) |
| SSO corporativo | Substituir `src/lib/auth/sessao.ts` e a tela de login. Os guards e as regras de permissão continuam os mesmos |
| PDF da cotação | Gerar a partir da página `/admin/solicitacoes/[id]` |
| Upload de imagens | Hoje `imagemUrl` é uma URL digitada pelo admin |
| ERP, CRM, estoque | Não implementados |
| Outras integrações de tarefas | Seguir o modelo de `src/lib/integracoes/` (montagem pura + chamada com `fetch` injetável + sincronização com trava) |

## Observações conhecidas

- O login não tem limite de tentativas (rate limit). Para exposição fora da rede interna, adicione um limite no proxy reverso ou na action `entrar`.
- Em `next.config.ts`, o cache em disco do Turbopack para `next dev` está desligado. Com ele ligado (Next 16.3.8, Windows), as rotas `/admin/produtos/[id]/precos/**` passavam a responder 404 depois de reiniciar o servidor de desenvolvimento. O build de produção não é afetado.
