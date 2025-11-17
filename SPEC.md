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

## Gestao de Equipamentos

### Descricao

Sistema completo de gestao de equipamentos que permite rastrear a localizacao, alocacao e movimentacao de equipamentos, garantindo transparencia e controle sobre quem autoriza e executa cada acao. Inclui funcionalidades de cadastro, visualizacao, movimentacao e registro de manutencoes.

### Requisitos

- Sistema web com login e senha de usuarios
- Cadastro de equipamentos com informacoes detalhadas
- Visualizacao da localizacao atual de cada equipamento
- Sistema de movimentacao com autorizacao
- Registro de manutencoes realizadas
- Historico completo de movimentacoes e manutencoes
- Rastreabilidade completa: visibilidade total sobre onde cada equipamento esta e quem e responsavel
- Controle de autorizacao: registro de quem autoriza movimentacoes, garantindo governanca
- Auditoria: trilha completa de todas as acoes realizadas no sistema

### Fluxos

#### Cadastro de Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant UI as EquipmentCreatePage
    participant S as +page.server.ts (createEquipment)
    participant DB as Drizzle ORM
    participant A as AuditLog
    
    U->>UI: Preenche formulario de cadastro
    UI->>S: POST createEquipment(formData)
    S->>S: Validar dados (nome obrigatorio, serial unico)
    S->>DB: Verificar se serial_number ja existe
    DB-->>S: Resultado da verificacao
    alt Serial number ja existe
        S-->>UI: Erro: SERIAL_NUMBER_EXISTS
        UI-->>U: Toast de erro
    else Dados validos
        S->>DB: Inserir equipamento em equipment
        DB-->>S: Equipamento criado
        S->>A: Registrar audit log (equipment.create)
        A-->>S: Log registrado
        S-->>UI: Sucesso com dados do equipamento
        UI-->>U: Toast de sucesso + redireciona para detalhes
    end
```

#### Visualizacao de Equipamentos e Localizacao

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant UI as EquipmentListPage
    participant S as +page.server.ts (load)
    participant DB as Drizzle ORM
    
    U->>UI: Acessa /equipment
    UI->>S: GET load()
    S->>S: Verificar autenticacao
    S->>DB: Buscar equipamentos com joins
    Note over DB: JOIN location, user (current),<br/>user (created_by)
    DB-->>S: Lista de equipamentos com relacionamentos
    S->>DB: Buscar movimentacoes recentes (opcional)
    DB-->>S: Movimentacoes
    S-->>UI: Dados formatados
    UI-->>U: Renderiza lista com cards de equipamentos
    Note over UI: Cada card mostra:<br/>- Nome e categoria<br/>- Localizacao atual<br/>- Usuario atual<br/>- Status
```

#### Movimentacao de Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario (Executor)
    participant A as Usuario (Autorizador)
    participant UI as EquipmentMovePage
    participant S as +page.server.ts (moveEquipment)
    participant DB as Drizzle ORM
    participant ALOG as AuditLog
    
    U->>UI: Acessa /equipment/[id]/move
    UI->>S: GET load() - carrega dados do equipamento
    S->>DB: Buscar equipamento e localizacao atual
    DB-->>S: Dados do equipamento
    S-->>UI: Formulario pre-preenchido
    
    U->>UI: Preenche destino, motivo, seleciona autorizador
    UI->>S: POST moveEquipment(formData)
    S->>S: Validar permissoes e dados
    S->>DB: Criar registro em equipment_movement (status: pending)
    DB-->>S: Movimentacao criada
    
    alt Requer autorizacao
        S->>A: Notificacao (futuro: email/notificacao)
        A->>UI: Acessa pagina de autorizacao
        A->>S: POST approveMovement(movementId)
        S->>DB: Atualizar status para 'approved'
        DB-->>S: Atualizado
    end
    
    S->>DB: Atualizar equipment (currentLocationId, currentUserId)
    DB-->>S: Equipamento atualizado
    S->>DB: Atualizar movement (status: completed, completedAt)
    DB-->>S: Movimentacao completada
    S->>ALOG: Registrar audit log (equipment.move)
    ALOG-->>S: Log registrado
    S-->>UI: Sucesso
    UI-->>U: Toast de sucesso + redireciona
```

#### Cadastro de Manutencao

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant UI as MaintenanceCreatePage
    participant S as +page.server.ts (createMaintenance)
    participant DB as Drizzle ORM
    participant ALOG as AuditLog
    
    U->>UI: Acessa /equipment/[id]/maintenance
    UI->>S: GET load() - carrega equipamento
    S->>DB: Buscar equipamento
    DB-->>S: Dados do equipamento
    S-->>UI: Formulario de manutencao
    
    U->>UI: Preenche tipo, descricao, datas, custo
    UI->>S: POST createMaintenance(formData)
    S->>S: Validar dados (tipo obrigatorio, descricao obrigatoria)
    S->>DB: Criar registro em equipment_maintenance
    DB-->>S: Manutencao criada
    S->>DB: Atualizar status do equipamento para 'maintenance' (se necessario)
    DB-->>S: Equipamento atualizado
    S->>ALOG: Registrar audit log (equipment.maintenance.create)
    ALOG-->>S: Log registrado
    S-->>UI: Sucesso
    UI-->>U: Toast de sucesso + redireciona
```

#### Visualizacao de Detalhes do Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant UI as EquipmentDetailPage
    participant S as +page.server.ts (load)
    participant DB as Drizzle ORM
    
    U->>UI: Acessa /equipment/[id]
    UI->>S: GET load({ params })
    S->>S: Validar autenticacao
    S->>DB: Buscar equipamento com todos os relacionamentos
    Note over DB: JOIN location, user (current),<br/>user (created_by)
    DB-->>S: Dados do equipamento
    S->>DB: Buscar historico de movimentacoes (ultimas 10)
    DB-->>S: Movimentacoes ordenadas por data
    S->>DB: Buscar historico de manutencoes (ultimas 10)
    DB-->>S: Manutencoes ordenadas por data
    S-->>UI: Dados agregados
    UI-->>U: Renderiza pagina de detalhes com:
    Note over UI: - Informacoes do equipamento<br/>- Localizacao atual<br/>- Usuario atual<br/>- Historico de movimentacoes<br/>- Historico de manutencoes<br/>- Botoes de acao (mover, manutencao)
```

### Schema

A funcionalidade utiliza as seguintes tabelas:

- `equipment`: Armazena equipamentos com informacoes detalhadas (nome, descricao, numero de serie, categoria, status, localizacao atual, usuario atual)
- `location`: Armazena localizacoes (departamentos, salas, etc)
- `equipment_movement`: Registro de todas as movimentacoes de equipamentos (origem, destino, executor, autorizador, motivo, status)
- `equipment_maintenance`: Registro de todas as manutencoes realizadas (tipo, descricao, custo, datas, status)

```mermaid
erDiagram
    USER ||--o{ EQUIPMENT : "current_user"
    USER ||--o{ EQUIPMENT_MOVEMENT : "moved_by"
    USER ||--o{ EQUIPMENT_MOVEMENT : "authorized_by"
    USER ||--o{ EQUIPMENT_MOVEMENT : "from_user"
    USER ||--o{ EQUIPMENT_MOVEMENT : "to_user"
    USER ||--o{ EQUIPMENT_MAINTENANCE : "performed_by"
    USER ||--o{ EQUIPMENT_MAINTENANCE : "authorized_by"
    USER ||--o{ EQUIPMENT_MAINTENANCE : "created_by"
    USER ||--o{ EQUIPMENT : "created_by"
    USER ||--o{ LOCATION : "created_by"
    
    LOCATION ||--o{ EQUIPMENT : "current_location"
    LOCATION ||--o{ EQUIPMENT_MOVEMENT : "from_location"
    LOCATION ||--o{ EQUIPMENT_MOVEMENT : "to_location"
    
    EQUIPMENT ||--o{ EQUIPMENT_MOVEMENT : "has_movements"
    EQUIPMENT ||--o{ EQUIPMENT_MAINTENANCE : "has_maintenances"
    
    EQUIPMENT {
        TEXT id PK
        TEXT name "NOT NULL"
        TEXT description
        TEXT serial_number "UNIQUE"
        TEXT category
        TEXT status "NOT NULL, DEFAULT 'available'"
        TEXT current_location_id FK
        TEXT current_user_id FK
        TIMESTAMPTZ created_at "NOT NULL"
        TEXT created_by_id FK
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ deleted_at
        TEXT deleted_by_id FK
    }
    
    LOCATION {
        TEXT id PK
        TEXT name "NOT NULL"
        TEXT description
        TEXT address
        TIMESTAMPTZ created_at "NOT NULL"
        TEXT created_by_id FK
        TIMESTAMPTZ deleted_at
        TEXT deleted_by_id FK
    }
    
    EQUIPMENT_MOVEMENT {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT from_location_id FK
        TEXT to_location_id FK "NOT NULL"
        TEXT from_user_id FK
        TEXT to_user_id FK
        TEXT moved_by_id FK "NOT NULL"
        TEXT authorized_by_id FK
        TEXT reason
        TEXT status "NOT NULL, DEFAULT 'pending'"
        TIMESTAMPTZ created_at "NOT NULL"
        TIMESTAMPTZ completed_at
    }
    
    EQUIPMENT_MAINTENANCE {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT maintenance_type "NOT NULL"
        TEXT description "NOT NULL"
        INT cost
        TEXT performed_by_id FK
        TEXT authorized_by_id FK
        TIMESTAMPTZ start_date
        TIMESTAMPTZ end_date
        TEXT status "NOT NULL, DEFAULT 'scheduled'"
        TIMESTAMPTZ created_at "NOT NULL"
        TEXT created_by_id FK "NOT NULL"
    }
```

### Componentes

- `EquipmentCard.svelte`: Card para lista de equipamentos
- `EquipmentForm.svelte`: Formulario de cadastro/edicao
- `EquipmentDetailCard.svelte`: Card de detalhes do equipamento
- `MovementForm.svelte`: Formulario de movimentacao
- `MovementHistory.svelte`: Lista de historico de movimentacoes
- `MaintenanceForm.svelte`: Formulario de manutencao
- `MaintenanceHistory.svelte`: Lista de historico de manutencoes
- `LocationSelector.svelte`: Seletor de localizacao
- `UserSelector.svelte`: Seletor de usuario
- `StatusBadge.svelte`: Badge de status do equipamento

### Estrutura de Modulos

Seguindo o padrao do projeto, todo o modulo de equipamentos sera criado em `src/routes/equipment/`:

```
src/routes/equipment/
├── +page.server.ts          # Server-side logic principal
├── +page.svelte             # Lista de equipamentos
├── page.server.spec.ts      # Testes unitarios do servidor
├── page.spec.ts             # Testes unitarios do cliente
├── create/
│   ├── +page.server.ts      # Logica de criacao
│   ├── +page.svelte         # Formulario de cadastro
│   └── page.server.spec.ts  # Testes
├── [id]/
│   ├── +page.server.ts      # Detalhes do equipamento
│   ├── +page.svelte         # Visualizacao de detalhes
│   ├── page.server.spec.ts  # Testes
│   ├── move/
│   │   ├── +page.server.ts  # Logica de movimentacao
│   │   ├── +page.svelte     # Formulario de movimentacao
│   │   └── page.server.spec.ts
│   └── maintenance/
│       ├── +page.server.ts  # Logica de manutencao
│       ├── +page.svelte     # Formulario de manutencao
│       └── page.server.spec.ts
└── utils.server.ts          # Funcoes utilitarias compartilhadas
```

### Seguranca e Validacoes

#### Validacoes Server-Side

- **Criacao de equipamento:**
  - Nome obrigatorio (max 255 caracteres)
  - Serial number unico (se fornecido)
  - Usuario autenticado obrigatorio

- **Movimentacao:**
  - Equipamento deve existir
  - Localizacao de destino obrigatoria
  - Usuario executor deve estar autenticado
  - Se requer autorizacao, authorizedById deve ser valido

- **Manutencao:**
  - Equipamento deve existir
  - Tipo e descricao obrigatorios
  - Data de inicio nao pode ser futura (se status for completed)

#### Permissoes

- Todos os usuarios autenticados podem visualizar equipamentos
- Todos os usuarios autenticados podem criar equipamentos
- Todos os usuarios autenticados podem mover equipamentos
- Todos os usuarios autenticados podem registrar manutencoes
- Auditoria completa: todas as operacoes sao registradas em `audit_log`

### Localizacao

Todas as strings estao internacionalizadas em `messages/pt-br.json` e sincronizadas com outros idiomas via `project.inlang`.