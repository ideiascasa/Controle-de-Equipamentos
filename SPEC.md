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

---

## Sistema de Gestao de Equipamentos

### Descricao

Sistema web completo para gestao de equipamentos com rastreabilidade de movimentacoes, controle de alocacao e registro de manutencoes. Permite que organizacoes controlem de forma eficiente o ciclo de vida completo de seus ativos fisicos.

### Requisitos

- **Autenticacao e Autorizacao**: Login com usuario e senha, controle de permissoes por grupo de usuarios, diferentes niveis de acesso
- **Cadastro de Equipamentos**: Criacao de equipamentos com informacoes completas (codigo unico, nome, categoria, fabricante, modelo, numero de serie, data de aquisicao, valor, status, localizacao, observacoes)
- **Visualizacao de Equipamentos**: Listagem com filtros e busca, visualizacao detalhada, historico completo de movimentacoes, informacoes de alocacao
- **Movimentacao de Equipamentos**: Solicitacao, aprovacao/autorizacao, execucao de movimentacoes, notificacoes, registro automatico de auditoria
- **Gestao de Manutencao**: Cadastro de manutencoes (preventiva/corretiva), agendamento, registro de historico, alertas, vinculacao a equipamentos

### Fluxos

#### Fluxo de Cadastro de Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Autenticado
    participant UI as EquipmentForm
    participant S as +page.server.ts (action createEquipment)
    participant DB as Drizzle ORM
    participant AL as AuditLog
    
    U->>UI: Preenche formulario de novo equipamento
    UI->>UI: Valida dados do formulario
    UI->>S: POST createEquipment(data)
    S->>S: Valida permissoes (grupo de usuarios)
    S->>S: Valida dados (codigo unico, campos obrigatorios)
    S->>DB: Verifica se codigo ja existe
    DB-->>S: Resultado da verificacao
    alt Codigo ja existe
        S-->>UI: Erro: Codigo ja cadastrado
        UI-->>U: Toast de erro
    else Codigo disponivel
        S->>DB: Insere equipamento
        DB-->>S: Equipamento criado
        S->>AL: Registra acao de criacao
        AL-->>S: Auditoria registrada
        S-->>UI: Sucesso com dados do equipamento
        UI-->>U: Toast de sucesso + redireciona para detalhes
    end
```

#### Fluxo de Solicitacao de Movimentacao

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Solicitante
    participant UI as MovementRequestForm
    participant S as +page.server.ts (action requestMovement)
    participant DB as Drizzle ORM
    participant AL as AuditLog
    
    U->>UI: Seleciona equipamento e preenche dados de movimentacao
    UI->>UI: Valida formulario (origem, destino, usuario destino)
    UI->>S: POST requestMovement(data)
    S->>S: Valida permissoes
    S->>DB: Verifica status atual do equipamento
    DB-->>S: Status e localizacao atual
    alt Equipamento indisponivel ou em manutencao
        S-->>UI: Erro: Equipamento nao pode ser movimentado
        UI-->>U: Toast de erro
    else Equipamento disponivel
        S->>DB: Cria registro de movimentacao (status: pending)
        DB-->>S: Movimentacao criada
        S->>AL: Registra acao de solicitacao
        AL-->>S: Auditoria registrada
        S-->>UI: Sucesso: Movimentacao solicitada
        UI-->>U: Toast de sucesso + atualiza lista
    end
```

#### Fluxo de Aprovacao de Movimentacao

```mermaid
sequenceDiagram
    autonumber
    participant A as Usuario Autorizador
    participant UI as MovementApprovalDialog
    participant S as +page.server.ts (action approveMovement)
    participant DB as Drizzle ORM
    participant AL as AuditLog
    
    A->>UI: Visualiza movimentacao pendente
    UI->>S: GET /equipment/movements/[id] (load)
    S->>DB: Busca detalhes da movimentacao
    DB-->>S: Dados completos da movimentacao
    S-->>UI: Exibe detalhes para aprovacao
    A->>UI: Clica em "Aprovar" ou "Rejeitar"
    UI->>UI: Abre dialogo de confirmacao
    A->>UI: Confirma acao
    UI->>S: POST approveMovement(movementId, action)
    S->>S: Valida permissoes
    S->>DB: Busca movimentacao atual
    DB-->>S: Status atual da movimentacao
    alt Movimentacao ja processada
        S-->>UI: Erro: Movimentacao ja foi processada
        UI-->>A: Toast de erro
    else Movimentacao pendente
        alt Aprovacao
            S->>DB: Atualiza movimentacao (status: approved)
            DB-->>S: Movimentacao aprovada
            S->>AL: Registra acao de aprovacao
            AL-->>S: Auditoria registrada
            S-->>UI: Sucesso: Movimentacao aprovada
            UI-->>A: Toast de sucesso + atualiza status
        else Rejeicao
            S->>DB: Atualiza movimentacao (status: rejected)
            DB-->>S: Movimentacao rejeitada
            S->>AL: Registra acao de rejeicao
            AL-->>S: Auditoria registrada
            S-->>UI: Sucesso: Movimentacao rejeitada
            UI-->>A: Toast de sucesso + atualiza status
        end
    end
```

#### Fluxo de Execucao de Movimentacao

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Executor
    participant UI as MovementDetails
    participant S as +page.server.ts (action completeMovement)
    participant DB as Drizzle ORM
    participant AL as AuditLog
    
    U->>UI: Visualiza movimentacao aprovada
    UI->>S: GET /equipment/movements/[id] (load)
    S->>DB: Busca movimentacao e equipamento
    DB-->>S: Dados da movimentacao (status: approved)
    S-->>UI: Exibe detalhes e botao "Executar Movimentacao"
    U->>UI: Clica em "Executar Movimentacao"
    UI->>UI: Abre dialogo de confirmacao
    U->>UI: Confirma execucao
    UI->>S: POST completeMovement(movementId)
    S->>S: Valida permissoes e status (deve estar approved)
    S->>DB: Inicia transacao
    S->>DB: Atualiza equipamento (current_location, current_user_id, status)
    DB-->>S: Equipamento atualizado
    S->>DB: Atualiza movimentacao (status: completed, completion_date)
    DB-->>S: Movimentacao completada
    S->>AL: Registra acao de execucao
    AL-->>S: Auditoria registrada
    S->>DB: Commit transacao
    DB-->>S: Transacao confirmada
    S-->>UI: Sucesso: Movimentacao executada
    UI-->>U: Toast de sucesso + atualiza status do equipamento
```

### Schema

#### Tabela `equipment`

- `id`: TEXT PRIMARY KEY
- `code`: TEXT NOT NULL UNIQUE (codigo unico do equipamento)
- `name`: TEXT NOT NULL
- `description`: TEXT
- `category`: TEXT (categoria/tipo do equipamento)
- `manufacturer`: TEXT
- `model`: TEXT
- `serial_number`: TEXT
- `acquisition_date`: TIMESTAMPTZ
- `value`: INTEGER (valor em centavos)
- `status`: TEXT NOT NULL DEFAULT 'available' (available, allocated, maintenance, unavailable)
- `current_location`: TEXT
- `current_user_id`: TEXT FK -> user.id (usuario atual responsavel)
- `notes`: TEXT
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `created_by_id`: TEXT FK -> user.id
- `updated_at`: TIMESTAMPTZ
- `updated_by_id`: TEXT FK -> user.id
- `deleted_at`: TIMESTAMPTZ
- `deleted_by_id`: TEXT FK -> user.id

#### Tabela `equipment_movement`

- `id`: TEXT PRIMARY KEY
- `equipment_id`: TEXT NOT NULL FK -> equipment.id
- `from_location`: TEXT
- `to_location`: TEXT NOT NULL
- `from_user_id`: TEXT FK -> user.id (usuario que tinha o equipamento)
- `to_user_id`: TEXT FK -> user.id (usuario que recebera o equipamento)
- `requested_by_id`: TEXT NOT NULL FK -> user.id (quem solicitou)
- `authorized_by_id`: TEXT FK -> user.id (quem autorizou)
- `status`: TEXT NOT NULL DEFAULT 'pending' (pending, approved, rejected, completed, cancelled)
- `request_date`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `authorization_date`: TIMESTAMPTZ
- `completion_date`: TIMESTAMPTZ
- `notes`: TEXT
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `created_by_id`: TEXT FK -> user.id

#### Tabela `equipment_maintenance`

- `id`: TEXT PRIMARY KEY
- `equipment_id`: TEXT NOT NULL FK -> equipment.id
- `type`: TEXT NOT NULL (preventive, corrective)
- `description`: TEXT NOT NULL
- `scheduled_date`: TIMESTAMPTZ
- `completed_date`: TIMESTAMPTZ
- `status`: TEXT NOT NULL DEFAULT 'scheduled' (scheduled, in_progress, completed, cancelled)
- `cost`: INTEGER (custo em centavos)
- `provider`: TEXT (fornecedor/prestador do servico)
- `technician`: TEXT (tecnico responsavel)
- `notes`: TEXT
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `created_by_id`: TEXT FK -> user.id
- `updated_at`: TIMESTAMPTZ
- `updated_by_id`: TEXT FK -> user.id

### Estrutura de Modulos

O modulo de equipamentos sera criado em `src/routes/equipment/`:

```
src/routes/equipment/
├── +page.server.ts          # Server-side logic principal
├── +page.svelte             # Listagem de equipamentos
├── page.server.spec.ts      # Testes unitarios do servidor
├── page.spec.ts             # Testes unitarios do cliente
├── [id]/
│   ├── +page.server.ts      # Detalhes do equipamento
│   ├── +page.svelte         # Visualizacao detalhada
│   ├── page.server.spec.ts
│   └── page.spec.ts
├── create/
│   ├── +page.server.ts      # Criacao de equipamento
│   ├── +page.svelte         # Formulario de criacao
│   ├── page.server.spec.ts
│   └── page.spec.ts
├── movements/
│   ├── +page.server.ts      # Listagem de movimentacoes
│   ├── +page.svelte         # Interface de movimentacoes
│   ├── page.server.spec.ts
│   └── page.spec.ts
├── movements/
│   └── [id]/
│       ├── +page.server.ts  # Detalhes da movimentacao
│       ├── +page.svelte     # Visualizacao e aprovacao
│       ├── page.server.spec.ts
│       └── page.spec.ts
└── maintenance/
    ├── +page.server.ts      # Listagem de manutencoes
    ├── +page.svelte         # Interface de manutencoes
    ├── page.server.spec.ts
    └── page.spec.ts
```

### Componentes

Em `src/lib/components/equipment/`:

- `EquipmentCard.svelte` - Card para exibicao de equipamento em listagens
- `EquipmentForm.svelte` - Formulario de criacao/edicao de equipamento
- `EquipmentList.svelte` - Lista de equipamentos com filtros
- `EquipmentDetails.svelte` - Visualizacao detalhada de equipamento
- `MovementRequestForm.svelte` - Formulario de solicitacao de movimentacao
- `MovementApprovalDialog.svelte` - Dialogo para aprovacao de movimentacoes
- `MovementHistory.svelte` - Historico de movimentacoes de um equipamento
- `MaintenanceForm.svelte` - Formulario de cadastro de manutencao
- `MaintenanceList.svelte` - Lista de manutencoes
- `LocationSelector.svelte` - Seletor de localizacao
- `StatusBadge.svelte` - Badge de status do equipamento

### Seguranca

- Validacao server-side: permissoes baseadas em grupos de usuarios
- Validacao de dados: codigo unico obrigatorio, campos validados
- Soft delete: equipamentos nao sao removidos fisicamente
- Auditoria completa: todas as operacoes sao registradas em `audit_log`
- Controle de acesso: diferentes niveis (visualizacao, movimentacao, autorizacao, administracao)

### Localizacao

Todas as strings estao internacionalizadas em `messages/pt-br.json` e sincronizadas com outros idiomas via `project.inlang`.
