# Specification Document (use Mermaid.js, also use sequence diagrams)

> This document mirrors;

- SPEC.md
- src/routes/doc/spec/+page.md

---

## Gestao de Grupos pelo Usuario Sistema

### Descricao

Funcionalidade que permite ao usuario de sistema (ID = 1) gerenciar grupos diretamente na rota `user/profile`. O usuario sistema pode criar novos grupos e excluir grupos existentes, garantindo governanca, trilha de auditoria e integracao com as regras de permissao da plataforma.

### Requisitos

- Card exclusivo visivel apenas para `userId === 1`
- Formulario inline para criar grupo com nome e descricao opcionais
- Lista com grupos existentes, exibindo contadores de membros
- Acoes: criar, excluir (com confirm modal), e visualizar detalhes
- Feedback otimista e tratamento de erros com toasts
- Auditoria: registrar criador, timestamps, usuario responsavel pela exclusao

### Fluxos

```mermaid
sequenceDiagram
    autonumber
    participant A as Admin ID 1
    participant UI as GroupManagementCard
    participant S as +page.server.ts (action createSystemGroup)
    participant DB as Drizzle ORM
    A->>UI: Preenche formulario de novo grupo
    UI->>S: POST createSystemGroup(data)
    S->>S: Validar permissoes e dados
    S->>DB: Inserir em group e groupAuditLog
    DB-->>S: Retorna registros
    S-->>UI: Resposta sucesso
    UI-->>A: Toast sucesso + atualiza lista
```

```mermaid
sequenceDiagram
    autonumber
    participant A as Admin ID 1
    participant UI as GroupListItem
    participant C as ConfirmDeleteDialog
    participant S as +page.server.ts (action deleteSystemGroup)
    participant DB as Drizzle ORM
    A->>UI: Clica excluir grupo
    UI->>C: Abre dialogo de confirmacao
    C->>S: POST deleteSystemGroup(groupId)
    S->>S: Validar id, checar membros
    S->>DB: Soft delete group + registrar audit
    DB-->>S: Confirma operacao
    S-->>UI: Status OK
    UI-->>A: Remove item e mostra toast
```

```mermaid
sequenceDiagram
    autonumber
    participant Job as hooks.server.ts
    participant S as +page.server.ts load
    participant DB as Drizzle ORM
    participant UI as GroupManagementCard
    Job->>S: Injeta usuario autenticado
    S->>DB: Buscar grupos, contagens e auditorias recentes
    DB-->>S: Dados agregados
    S-->>UI: Props com dados
    UI-->>UI: Renderiza card somente se userId === 1
```

### Schema

A funcionalidade utiliza as seguintes tabelas:

- `group`: Armazena grupos com campos de auditoria (description, createdAt, createdById, deletedAt, deletedById)
- `rel_group`: Relacionamento usuario-grupo com campos de auditoria (createdById, joinedAt)
- `group_audit_log`: Registro de todas as acoes realizadas nos grupos (create, delete)

### Componentes

- `GroupManagementCard.svelte`: Card principal que exibe lista de grupos e formulario de criacao
- `GroupForm.svelte`: Formulario inline para criar grupos (integrado no card)
- `GroupList.svelte` + `GroupListItem.svelte`: Lista e linha de grupo (integrado no card)
- `ConfirmDeleteDialog.svelte`: Dialogo de confirmacao para exclusao (usando AlertDialog do shadcn-svelte)

### Seguranca

- Validacao server-side: apenas usuario ID 1 pode executar as acoes
- Validacao de dados: nome obrigatorio (max 64 chars), descricao opcional (max 256 chars)
- Soft delete: grupos nao sao removidos fisicamente, apenas marcados como deletados
- Validacao de membros: nao permite excluir grupos que possuem membros
- Auditoria completa: todas as operacoes sao registradas em `group_audit_log`

### Localizacao

Todas as strings estao internacionalizadas em `messages/pt-br.json` e sincronizadas com outros idiomas via `project.inlang`.

---

## Funcionalidade: Gerenciamento de grupos do usuario sistema

### Contexto
- Permitir que o usuario mestre (id 1, criado no bootstrap da plataforma) gerencie grupos diretamente em `user/profile`.
- Manter rastreabilidade de quem executa cada acao e garantir mensagens internacionalizadas.
- Preservar arquitetura modular existente em `src/routes/user` e manter validacoes no backend com drizzle.

### Regras de negocio
- Card visivel somente quando `locals.user.id === '1'`.
- Acoes disponiveis: criar grupo com nome e descricao opcionais e excluir grupos existentes via confirmacao.
- Registrar auditoria de criacao e exclusao utilizando tabelas dedicadas.
- Impedir que grupos com membros ativos sejam removidos sem verificacoes adicionais.

### Implementacao
- `src/routes/user/profile/+page.svelte`: renderizar `GroupManagementCard` com formulario inline, lista de grupos e confirm modal.
- `src/routes/user/profile/+page.server.ts`: fornecer `load` com grupos e contagens, actions `createGroup` e `deleteGroup` protegidas por permissao do usuario mestre.
- `src/lib/components/user/GroupManagementCard.svelte` e subcomponentes `GroupForm`, `GroupList`, `GroupListItem`, `ConfirmDeleteDialog` para UI reutilizavel.
- `src/lib/utils/groups.ts`: validacoes de entrada (nome, descricao) e formatadores.
- `src/lib/db/schema.ts`: adicionar tabelas `group`, `userGroup` e `groupAuditLog` com campos de auditoria (createdAt, createdById, deletedAt, deletedById).
- Adicionar migracoes drizzle correspondentes e seeds iniciais quando necessario.
- Atualizar `messages/*.json` com chaves de texto (labels, tooltips, toasts) sincronizadas via `project.inlang`.

### Fluxo principal

```mermaid
sequenceDiagram
    actor Admin as Usuario sistema (id 1)
    participant UI as GroupManagementCard
    participant Server as +page.server.ts
    participant DB as drizzle
    Admin->>UI: Preenche formulario de novo grupo
    UI->>Server: Envia action createGroup
    Server->>Server: Valida permissao e dados
    Server->>DB: Persiste grupo e auditoria
    DB-->>Server: Registro criado
    Server-->>UI: Retorna sucesso
    UI-->>Admin: Atualiza lista e mostra toast
```

### Fluxo de remocao

```mermaid
sequenceDiagram
    actor Admin as Usuario sistema (id 1)
    participant UI as GroupListItem
    participant Dialog as ConfirmDeleteDialog
    participant Server as +page.server.ts
    participant DB as drizzle
    Admin->>UI: Solicita exclusao de grupo
    UI->>Dialog: Abre confirmacao
    Admin->>Dialog: Confirma exclusao
    Dialog->>Server: Envia action deleteGroup
    Server->>DB: Executa soft delete e registra auditoria
    DB-->>Server: Confirma operacao
    Server-->>UI: Retorna status ok
    UI-->>Admin: Remove item e apresenta toast
```