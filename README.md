# Fluxo — Workspace (Next.js + banco de dados real)

Port do wireframe de UI estilo Notion para um app Next.js 16 (App Router) + TypeScript +
Tailwind CSS v4, agora com **persistência real em banco de dados** (SQLite via
[Drizzle ORM](https://orm.drizzle.team/) + [`@libsql/client`](https://github.com/tursodatabase/libsql-client-ts)),
pronto para rodar tanto localmente quanto na **Vercel**.

## ✨ Novos Recursos Implementados

- 🔐 **Autenticação real** com NextAuth.js (Credentials provider - email/senha)
- 🔗 **Backlinks com sintaxe `[[Nota]]`** (wiki-links estilo Notion/Obsidian)
- 📁 **Upload de arquivos/imagens** (local em dev, Vercel Blob em produção)
- ⚡ **Colaboração em tempo real** via Server-Sent Events (SSE)
- 👤 **Multi-usuário** com isolamento de dados por usuário

---

## Por que SQLite funciona na Vercel aqui (e um arquivo `.db` puro não funcionaria)

As funções da Vercel são serverless: o filesystem é **efêmero e somente leitura** em produção,
então um arquivo `.db` local não sobrevive entre requisições. Para contornar isso sem trocar de
banco, este projeto usa o **[Turso](https://turso.tech)** — um serviço que hospeda bancos SQLite de
verdade (o mesmo formato de arquivo) e os expõe via rede usando o protocolo `libsql`. Ele tem um
plano gratuito generoso e é literalmente SQLite por baixo.

O ótimo disso: **o código é idêntico** em dev e produção. A única diferença é a variável de
ambiente `DATABASE_URL`:

| Ambiente | `DATABASE_URL` | `DATABASE_AUTH_TOKEN` |
|---|---|---|
| Local (dev) | `file:local.db` (arquivo na raiz do projeto) | não precisa |
| Vercel (prod) | `libsql://seu-banco.turso.io` | token gerado pelo Turso CLI |

---

## Rodando localmente

```bash
npm install

# Crie o arquivo .env com suas configurações (copie do .env.example)
cp .env.example .env
# Edite .env e adicione NEXTAUTH_SECRET (gere com: openssl rand -base64 32)

# cria as tabelas no arquivo local.db e popula com dados de exemplo
npm run setup
# (equivalente a: npm run db:push && npm run db:seed)

npm run dev
```

Abra http://localhost:3000 — o app já nasce com lembretes, notas e eventos reais, gravados no
arquivo `local.db`. Marcar uma tarefa, criar uma nota, adicionar um evento: tudo é persistido de
verdade (dá pra fechar o servidor e abrir de novo que os dados continuam lá).

**Usuário demo:** `demo@fluxo.app` / `demo123456`

---

## Deploy na Vercel (com Turso)

1. **Crie o banco no Turso** (instale o CLI: `curl -sSfL https://get.tur.so/install.sh | bash`):
   ```bash
   turso auth signup        # ou: turso auth login
   turso db create fluxo-workspace
   turso db show fluxo-workspace --url        # copie essa URL
   turso db tokens create fluxo-workspace       # copie esse token
   ```

2. **Aplique o schema e popule o banco remoto** (rode localmente, apontando pro Turso):
   ```bash
   DATABASE_URL="libsql://fluxo-workspace-xxxx.turso.io" \
   DATABASE_AUTH_TOKEN="eyJhbGciOi..." \
   npm run setup
   ```

3. **Suba o projeto para o GitHub** e importe na [Vercel](https://vercel.com/new).

4. Em **Project Settings → Environment Variables**, adicione:
   - `DATABASE_URL` = `libsql://fluxo-workspace-xxxx.turso.io`
   - `DATABASE_AUTH_TOKEN` = o token gerado no passo 1
   - `NEXTAUTH_SECRET` = gere com `openssl rand -base64 32`
   - `NEXTAUTH_URL` = `https://seu-projeto.vercel.app`
   - `BLOB_READ_WRITE_TOKEN` = (opcional) token do Vercel Blob para upload de imagens

5. Deploy. Pronto — o app na Vercel lê/escreve no mesmo banco Turso.

> Alternativa sem Turso: se preferir Postgres "de verdade" (ex.: Vercel Postgres/Neon), troque
> `lib/db/client.ts` e `lib/db/schema.ts` para usar `drizzle-orm/node-postgres` — o resto do app
> (queries, actions, páginas) muda muito pouco porque a API do Drizzle é a mesma entre dialetos.

---

## Estrutura

```
app/
  layout.tsx              # shell: Sidebar + área de conteúdo (com AuthProvider)
  page.tsx                 # "Entrada" — dashboard (Server Component, lê do banco)
  api/
    auth/[...nextauth]/    # NextAuth.js route handler
    upload/                # Upload de arquivos (local + Vercel Blob)
    realtime/              # Server-Sent Events para colaboração em tempo real
  login/                   # Página de login
  register/                # Página de registro
  hoje/                     # tarefas e agenda do dia
  calendario/               # visão mensal + painel do dia selecionado
  notas/                     # lista de notas, editor e painel de backlinks
  lembretes/                 # lista de tarefas + painel de detalhes
  projetos/, pessoal/        # visão por espaço de trabalho
  arquivo/                    # notas arquivadas e tarefas concluídas
components/
  Sidebar.tsx                # navegação lateral (com user do session + logout)
  AuthProvider.tsx           # Provider do NextAuth
  FileUpload.tsx             # Componente de upload de arquivos
  ui.tsx                      # Checkbox, badges, SectionLabel
  *Client.tsx                  # componentes client que chamam Server Actions
lib/
  auth.ts                    # Configuração do NextAuth.js
  server-auth.ts             # Helpers para auth em Server Components
  realtime.ts                # Hooks para SSE (useRealtime, useNoteUpdates, etc.)
  db/
    schema.ts                  # tabelas Drizzle (users, accounts, sessions, reminders, subtasks, notes, events, files)
    client.ts                   # conexão (local.db ou Turso, conforme DATABASE_URL)
    queries.ts                   # leituras server-only (filtradas por userId)
    actions.ts                    # "use server" — mutações + broadcast SSE
    seed.ts                        # popula o banco (cria usuário demo + dados)
  types.ts, format.ts          # tipos e formatação
drizzle.config.ts                   # config do drizzle-kit
middleware.ts                       # Proteção de rotas (auth required)
```

---

## Como os dados fluem

- **Leitura**: cada `page.tsx` é um **Server Component assíncrono** que chama funções de
  `lib/db/queries.ts` diretamente (sem API route — o Next já roda isso no servidor).
- **Escrita**: os cliques (marcar tarefa, criar nota, etc.) chamam **Server Actions** em
  `lib/db/actions.ts` a partir dos componentes `*Client.tsx`. Cada action já chama
  `revalidatePath` nas rotas afetadas; o componente client só dispara `router.refresh()` para
  buscar a página atualizada.
- **Tempo real**: após cada mutação, as actions disparam `broadcastToUser()` via SSE.
  Os clientes conectados recebem eventos (`note_updated`, `reminder_updated`) e podem
  mesclar mudanças ou mostrar notificações.
- Não há API REST própria — Server Actions cobrem esse papel no App Router. Se algum dia você
  quiser expor uma API HTTP tradicional (para um app mobile nativo, por exemplo), dá pra criar
  `app/api/.../route.ts` reaproveitando as mesmas funções de `lib/db/queries.ts` e `actions.ts`.

---

## Autenticação

- **Provider**: Credentials (email + senha com bcrypt)
- **Sessão**: JWT com 30 dias de expiração
- **Páginas**: `/login`, `/register`
- **Middleware**: Protege todas as rotas exceto `/login`, `/register`, `/api/auth`
- **Usuário demo**: Criado automaticamente no seed (`demo@fluxo.app` / `demo123456`)

---

## Backlinks (Wiki-links)

Sintaxe: `[[Título da Nota]]` — cria um link bidirecional automático.

Exemplo:
```
Esta nota referencia o [[Projeto Ruby on Rails]] e o [[Roteiro para o 4° trimestre]].
```

O painel de **BACKLINKS** na lateral direita mostra todas as notas que citam a nota atual.

---

## Upload de Arquivos

- **Desenvolvimento**: arquivos salvos em `public/uploads/`
- **Produção (Vercel)**: usa [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- **Tipos permitidos**: JPEG, PNG, GIF, WebP, PDF, TXT, MD
- **Tamanho máximo**: 10MB
- **Uso**: No editor de notas, clique em "Adicionar imagem de capa" ou arraste uma imagem

---

## Colaboração em Tempo Real

- **Tecnologia**: Server-Sent Events (SSE) — funciona no Vercel sem WebSockets
- **Eventos**: `note_updated`, `reminder_updated`, `connected`, `ping`
- **Hooks**: `useRealtime()`, `useNoteUpdates(noteId)`, `useReminderUpdates(reminderId)`
- **Comportamento**: Quando outro usuário edita a mesma nota/tarefa, aparece uma notificação
  para mesclar (aceitar remoto) ou manter versão local

---

## Scripts úteis

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run start            # Inicia build de produção
npm run lint             # ESLint
npm run db:push          # Aplica o schema no banco (cria/atualiza tabelas)
npm run db:generate      # Gera arquivos de migration versionados (drizzle/)
npm run db:seed          # Repopula o banco com os dados de exemplo (idempotente)
npm run db:studio        # Abre o Drizzle Studio (GUI pra ver/editar o banco no navegador)
npm run setup            # db:push + db:seed
```