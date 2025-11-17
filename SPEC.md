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

Sistema completo de gestao de equipamentos que permite cadastro, rastreamento de localizacao, movimentacao entre locais/usuarios, autorizacao de movimentacoes e gestao de manutencao preventiva e corretiva.

### Requisitos

- Cadastro de equipamentos com informacoes detalhadas (nome, descricao, numero de serie, modelo, fabricante, categoria, status)
- Rastreamento de localizacao atual de cada equipamento
- Visualizacao de quem alocou e quem autorizou movimentacoes
- Sistema de movimentacao de equipamentos entre locais/usuarios
- Autorizacao de movimentacoes (quando necessario)
- Historico completo de movimentacoes e manutencoes
- Gestao de manutencao preventiva e corretiva
- Auditoria completa de todas as operacoes

### Fluxos

#### Fluxo de Cadastro de Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant UI as EquipmentCreatePage
    participant S as +page.server.ts (createEquipment)
    participant DB as Drizzle ORM
    participant AL as AuditLog
    
    U->>UI: Preenche formulario de cadastro
    UI->>S: POST createEquipment(formData)
    S->>S: Valida permissoes (usuario autenticado)
    S->>S: Valida dados (nome obrigatorio, serial unico)
    S->>DB: Verifica se serial_number ja existe
    DB-->>S: Retorna resultado
    alt Serial ja existe
        S-->>UI: Erro: SERIAL_ALREADY_EXISTS
        UI-->>U: Toast de erro
    else Serial disponivel
        S->>DB: Insere equipamento
        DB-->>S: Equipamento criado
        S->>AL: Registra auditoria (equipment.created)
        AL-->>S: Auditoria registrada
        S-->>UI: Sucesso com dados do equipamento
        UI-->>U: Toast de sucesso + redireciona para detalhes
    end
```

#### Fluxo de Movimentacao de Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Solicitante
    participant UI as EquipmentMovementPage
    participant S as +page.server.ts (createMovement)
    participant DB as Drizzle ORM
    participant A as Autorizador (se necessario)
    participant AL as AuditLog
    
    U->>UI: Solicita movimentacao de equipamento
    UI->>S: POST createMovement(equipmentId, toLocation, toUser)
    S->>S: Valida permissoes e dados
    S->>DB: Busca equipamento atual
    DB-->>S: Dados do equipamento
    S->>DB: Cria registro de movimentacao (status: pending)
    DB-->>S: Movimentacao criada
    S->>AL: Registra auditoria (equipment.movement.requested)
    
    alt Requer autorizacao
        S-->>UI: Movimentacao pendente de aprovacao
        UI-->>U: Notificacao de pendencia
        Note over A: Autorizador recebe notificacao
        A->>UI: Acessa lista de movimentacoes pendentes
        UI->>S: GET pendingMovements()
        S->>DB: Busca movimentacoes pendentes
        DB-->>S: Lista de movimentacoes
        S-->>UI: Dados das movimentacoes
        A->>UI: Aprova ou rejeita movimentacao
        UI->>S: POST approveMovement(movementId) ou rejectMovement(movementId)
        S->>DB: Atualiza status da movimentacao
        DB-->>S: Status atualizado
        S->>AL: Registra auditoria (equipment.movement.approved/rejected)
        alt Aprovado
            S->>DB: Atualiza currentLocation/currentUser do equipamento
            DB-->>S: Equipamento atualizado
            S->>DB: Marca movimentacao como completed
            DB-->>S: Movimentacao completada
            S->>AL: Registra auditoria (equipment.movement.completed)
            S-->>UI: Movimentacao aprovada e completada
            UI-->>U: Notificacao de movimentacao concluida
        else Rejeitado
            S-->>UI: Movimentacao rejeitada
            UI-->>U: Notificacao de rejeicao
        end
    else Nao requer autorizacao
        S->>DB: Atualiza currentLocation/currentUser do equipamento
        DB-->>S: Equipamento atualizado
        S->>DB: Marca movimentacao como completed
        DB-->>S: Movimentacao completada
        S->>AL: Registra auditoria (equipment.movement.completed)
        S-->>UI: Movimentacao completada
        UI-->>U: Toast de sucesso
    end
```

#### Fluxo de Registro de Manutencao

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant UI as EquipmentMaintenancePage
    participant S as +page.server.ts (createMaintenance)
    participant DB as Drizzle ORM
    participant AL as AuditLog
    
    U->>UI: Acessa pagina de manutencao do equipamento
    UI->>S: GET load(equipmentId)
    S->>DB: Busca equipamento e manutencoes anteriores
    DB-->>S: Dados do equipamento e historico
    S-->>UI: Dados para exibicao
    U->>UI: Preenche formulario de manutencao
    UI->>S: POST createMaintenance(formData)
    S->>S: Valida permissoes e dados
    S->>DB: Verifica se equipamento existe
    DB-->>S: Equipamento encontrado
    S->>DB: Insere registro de manutencao
    DB-->>S: Manutencao criada
    S->>DB: Atualiza status do equipamento para 'maintenance' (se necessario)
    DB-->>S: Status atualizado
    S->>AL: Registra auditoria (equipment.maintenance.created)
    AL-->>S: Auditoria registrada
    S-->>UI: Sucesso com dados da manutencao
    UI-->>U: Toast de sucesso + atualiza lista
```

#### Fluxo de Visualizacao de Equipamento e Historico

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant UI as EquipmentDetailPage
    participant S as +page.server.ts (load)
    participant DB as Drizzle ORM
    
    U->>UI: Acessa detalhes do equipamento
    UI->>S: GET load(equipmentId)
    S->>S: Valida permissoes (usuario autenticado)
    S->>DB: Busca equipamento por ID
    DB-->>S: Dados do equipamento
    S->>DB: Busca localizacao atual
    DB-->>S: Dados da localizacao
    S->>DB: Busca usuario atual (se aplicavel)
    DB-->>S: Dados do usuario
    S->>DB: Busca historico de movimentacoes
    DB-->>S: Lista de movimentacoes
    S->>DB: Busca historico de manutencoes
    DB-->>S: Lista de manutencoes
    S->>DB: Busca auditorias relacionadas
    DB-->>S: Lista de auditorias
    S-->>UI: Dados agregados do equipamento
    UI-->>U: Exibe informacoes completas com historico
```

### Schema

O sistema utiliza as seguintes tabelas:

- `equipment`: Armazena equipamentos com informacoes detalhadas (nome, descricao, numero de serie, modelo, fabricante, categoria, status, localizacao atual, usuario atual)
- `location`: Armazena localizacoes fisicas (nome, descricao, endereco, predio, andar, sala)
- `equipment_movement`: Registro de movimentacoes entre locais/usuarios (origem, destino, status, solicitante, autorizador)
- `equipment_maintenance`: Registro de manutencoes preventivas e corretivas (tipo, descricao, status, datas, custo, tecnico)
- `audit_log`: Registro de auditoria de todas as operacoes

#### Diagrama ER

```mermaid
erDiagram
    USER {
        TEXT id PK
        TEXT username
        TEXT name
    }
    
    EQUIPMENT {
        TEXT id PK
        TEXT name "NOT NULL"
        TEXT serial_number "UNIQUE"
        TEXT status "NOT NULL"
        TEXT current_location_id FK
        TEXT current_user_id FK
        TEXT created_by_id FK
    }
    
    LOCATION {
        TEXT id PK
        TEXT name "NOT NULL"
        TEXT address
        TEXT building
        TEXT room
        TEXT created_by_id FK
    }
    
    EQUIPMENT_MOVEMENT {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT from_location_id FK
        TEXT from_user_id FK
        TEXT to_location_id FK
        TEXT to_user_id FK
        TEXT status "NOT NULL"
        TEXT requested_by_id FK "NOT NULL"
        TEXT authorized_by_id FK
        TIMESTAMPTZ created_at "NOT NULL"
    }
    
    EQUIPMENT_MAINTENANCE {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT maintenance_type "NOT NULL"
        TEXT status "NOT NULL"
        TEXT created_by_id FK "NOT NULL"
        TIMESTAMPTZ scheduled_date
        TIMESTAMPTZ completed_date
    }
    
    AUDIT_LOG {
        TEXT id PK
        TEXT action "NOT NULL"
        TEXT performed_by_id FK
        JSONB payload
        TIMESTAMPTZ created_at "NOT NULL"
    }
    
    USER ||--o{ EQUIPMENT : "current_user"
    USER ||--o{ EQUIPMENT_MOVEMENT : "requested_by"
    USER ||--o{ EQUIPMENT_MOVEMENT : "authorized_by"
    USER ||--o{ EQUIPMENT_MAINTENANCE : "created_by"
    USER ||--o{ AUDIT_LOG : "performed_by"
    LOCATION ||--o{ EQUIPMENT : "current_location"
    LOCATION ||--o{ EQUIPMENT_MOVEMENT : "from_location"
    LOCATION ||--o{ EQUIPMENT_MOVEMENT : "to_location"
    EQUIPMENT ||--o{ EQUIPMENT_MOVEMENT : "movements"
    EQUIPMENT ||--o{ EQUIPMENT_MAINTENANCE : "maintenances"
```

### Componentes

- `EquipmentList.svelte`: Lista de equipamentos com filtros e busca
- `EquipmentCard.svelte`: Card individual de equipamento
- `EquipmentForm.svelte`: Formulario de cadastro/edicao
- `EquipmentDetail.svelte`: Visualizacao detalhada
- `MovementForm.svelte`: Formulario de movimentacao
- `MovementHistory.svelte`: Lista de movimentacoes
- `MaintenanceForm.svelte`: Formulario de manutencao
- `MaintenanceHistory.svelte`: Lista de manutencoes
- `LocationSelector.svelte`: Seletor de localizacao
- `UserSelector.svelte`: Seletor de usuario
- `StatusBadge.svelte`: Badge de status do equipamento
- `ApprovalDialog.svelte`: Dialogo de aprovacao/rejeicao

### Seguranca

- Validacao server-side: apenas usuarios autenticados podem executar acoes
- Validacao de dados: nome obrigatorio, numero de serie unico
- Soft delete: equipamentos nao sao removidos fisicamente, apenas marcados como deletados
- Auditoria completa: todas as operacoes sao registradas em `audit_log`
- Controle de autorizacao: movimentacoes podem requerer aprovacao de autorizador

### Localizacao

Todas as strings estao internacionalizadas em `messages/pt-br.json` e sincronizadas com outros idiomas via `project.inlang`.
