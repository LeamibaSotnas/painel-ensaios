# Painel de Ensaios e Repertório Musical

Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Postgres na nuvem.

Feito para deploy na **Vercel** com um banco **Postgres gerenciado** (Vercel
Postgres/Neon): todos os dados (usuários, departamentos, cronograma e
planilhas de louvores) ficam em um único banco compartilhado, acessível pela
internet — qualquer pessoa autorizada acessa de qualquer lugar, todos vendo
as mesmas informações em tempo real.

## Funcionalidades

- **Acesso por departamento**: cada departamento (Jovens/SA, Adolescentes/AD,
  Crianças/JD, Irmãs/RS, ou os que forem criados) tem sua própria planilha de
  louvores, cronograma e usuários. ADMIN vê e gerencia tudo; LIDER/MUSICOS só
  veem o próprio departamento (LIDER edita, MUSICOS só visualiza).
- **Planilha de louvores**: código sequencial automático sem hífen (SA1, SA2,
  AD1...), busca por nome/cantor, filtro por tom e por favoritos, reordenação
  manual, painel expansível com cifra/observações, registro da última
  execução com um clique.
- **YouTube**: ao colar um link, o título e a miniatura são capturados
  automaticamente via oEmbed (sem chave de API e sem download de vídeo/áudio)
  — o card mostra a miniatura e abre o vídeo direto no YouTube.
- **Cronograma**: agenda de ensaios com data/horário/local/responsável/
  observações, em visão de Lista ou Calendário mensal.
- **Departamentos** (ADMIN): criar, renomear e remover departamentos; o
  prefixo escolhido define o código das músicas daquele departamento.
- **Usuários** (ADMIN): criar/editar/remover contas, definir regra (ADMIN/
  LIDER/MUSICOS) e departamento.

## Stack de dados/autenticação

- **@vercel/postgres** — driver serverless (baseado no driver da Neon) para o
  banco Postgres na nuvem. Schema, migrações de coluna e seed inicial são
  aplicados automaticamente na primeira requisição (`src/core/db/client.ts`).
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
      cronograma/page.tsx          # grade geral de ensaios (Lista + Calendário)
      departamentos/page.tsx       # índice + gestão de departamentos (ADMIN)
      departamentos/[deptSlug]/page.tsx  # planilha de louvores do departamento
      usuarios/page.tsx            # gestão de usuários (ADMIN)
  components/
    LouvoresTable.tsx              # planilha: filtros, favoritos, YouTube, cifra
    EnsaioGrid.tsx                 # cronograma: Lista + Calendário
    UsuariosTable.tsx
    DepartamentosManager.tsx
    DashboardSidebar.tsx
    ui/                           # button, input, badge, table (shadcn real)
  core/
    db/
      client.ts                   # conexão Postgres (@