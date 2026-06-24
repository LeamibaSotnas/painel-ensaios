# Painel de Ensaios e Repertório Musical

Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + SQLite local.

100% local: não depende de nenhuma conta ou serviço em nuvem. Todos os dados
(usuários, departamentos, cronograma e planilhas de louvores) ficam em um
único arquivo SQLite na máquina onde o app roda.

## Stack de dados/autenticação

- **better-sqlite3** — banco de dados em arquivo (`data/painel.db`), criado e
  com schema aplicado automaticamente na primeira execução.
- **bcryptjs** — hash de senha (sem dependência nativa de build).
- **jose** — assinatura/verificação da sessão (JWT), compatível com Node e
  Edge Runtime, usado tanto nas Server Actions quanto em `middleware.ts`.

## Estrutura

```
src/
  app/
    page.tsx                     # login
    login-actions.ts             # server actions de auth (entrar/sair)
    dashboard/
      layout.tsx                  # layout protegido + sidebar
      page.tsx                    # visão geral (próximos ensaios)
      cronograma/page.tsx          # grade geral de ensaios
      departamentos/page.tsx       # índice de departamentos
      departamentos/[deptSlug]/page.tsx  # planilha de louvores
      usuarios/page.tsx            # gestão de usuários (ADMIN)
  components/
    LouvoresTable.tsx
    EnsaioGrid.tsx
    UsuariosTable.tsx
    DashboardSidebar.tsx
    ui/                           # button, input, badge, table (shadcn real)
  core/
    db/
      client.ts                   # conexão SQLite + criação/seed do schema
      queries.ts                   # funções tipadas de leitura/escrita
    auth/
      password.ts                  # hash/verificação de senha (bcryptjs)
      session.ts                   # criação/verificação do JWT (jose)
      get-usuario-atual.ts          # lê o cookie e retorna o usuário logado
    utils/code-generator.ts
  types/database.types.ts
  middleware.ts                   # protege /dashboard, redireciona logado de "/"
```

## Como rodar localmente

1. `npm install`
2. Copie `.env.example` para `.env.local` e defina `SESSION_SECRET` com uma
   string aleatória longa, por exemplo:
   ```
   openssl rand -base64 48
   ```
   (Opcionalmente, ajuste `ADMIN_PADRAO_EMAIL`/`ADMIN_PADRAO_SENHA`, usados
   apenas para criar o primeiro usuário ADMIN.)
3. `npm run dev` e acesse `http://localhost:3000`.

Na primeira execução, o app cria automaticamente:
- o arquivo `data/painel.db` com todas as tabelas;
- os departamentos padrão (Mocidade, Adolescentes, Geral);
- um usuário ADMIN inicial — por padrão `admin@local.app` / `admin123`
  (ou os valores definidos em `ADMIN_PADRAO_EMAIL`/`ADMIN_PADRAO_SENHA`).

**Troque a senha do ADMIN padrão assim que possível**, criando um novo
usuário ADMIN pela tela "Usuários" e removendo o antigo, ou pedindo para
implementar uma tela de troca de senha.

## Backup dos dados

Como tudo fica em `data/painel.db`, basta copiar esse arquivo para fazer
backup ou mover o painel para outra máquina. Ele não é versionado no git
(veja `.gitignore`).

## Build de produção

```
npm run build
npm run start
```

`typescript.ignoreBuil