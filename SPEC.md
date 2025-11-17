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

Sistema web de gestao de equipamentos que permite:

* **Autenticacao**: Integracao com o sistema de login e senha existente
* **Cadastro de Equipamentos**: Registro completo de equipamentos com informacoes detalhadas (codigo, descricao, categoria, status, etc.)
* **Visualizacao de Localizacao**: Interface para visualizar onde cada equipamento esta localizado atualmente
* **Rastreamento de Responsabilidades**: Exibicao de quem alocou o equipamento e quem autorizou sua movimentacao
* **Movimentacao de Equipamentos**: Funcionalidade para realizar transferencias de equipamentos entre locais/usuarios
* **Manutencao de Equipamentos**: Registro e acompanhamento de manutencoes preventivas e corretivas

### Requisitos

- Sistema web integrado com autenticacao existente
- Cadastro completo de equipamentos com codigo unico
- Rastreamento de localizacao atual de cada equipamento
- Sistema de movimentacao com autorizacao (quando necessario)
- Registro de manutencoes preventivas e corretivas
- Auditoria completa de todas as acoes
- Interface para visualizacao de historico de movimentacoes e manutencoes

### Fluxos

#### Fluxo 1: Cadastro de Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Autenticado
    participant UI as EquipmentForm
    participant S as +page.server.ts (createEquipment)
    participant DB as Drizzle ORM
    participant AL as AuditLog
    
    U->>UI: Preenche formulario de novo equipamento
    UI->>S: POST createEquipment(formData)
    S->>S: Validar permissoes (grupo admin)
    S->>S: Validar dados (code unico, campos obrigatorios)
    S->>DB: Verificar se code ja existe
    DB-->>S: Resultado da verificacao
    alt Code ja existe
        S-->>UI: Erro: CODE_ALREADY_EXISTS
        UI-->>U: Toast de erro
    else Code disponivel
        S->>DB: Inserir equipment
        DB-->>S: Equipamento criado
        S->>AL: Registrar audit log (equipment.create)
        AL-->>S: Log registrado
        S-->>UI: Sucesso com dados do equipamento
        UI-->>U: Toast de sucesso + redireciona para detalhes
    end
```

#### Fluxo 2: Visualizacao de Equipamentos e Localizacao

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Autenticado
    participant UI as EquipmentList
    participant S as +page.server.ts (load)
    participant DB as Drizzle ORM
    
    U->>UI: Acessa pagina de equipamentos
    UI->>S: GET /equipment (load function)
    S->>S: Verificar autenticacao
    S->>DB: Buscar equipamentos com joins (location, user)
    DB-->>S: Lista de equipamentos com dados relacionados
    S->>DB: Buscar estatisticas (total, por status, por localizacao)
    DB-->>S: Estatisticas agregadas
    S-->>UI: Dados completos (equipamentos + estatisticas)
    UI-->>U: Renderiza lista com filtros e busca
```

#### Fluxo 3: Movimentacao de Equipamento (Com Autorizacao)

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Solicitante
    participant UI as MovementForm
    participant S as +page.server.ts (moveEquipment)
    participant DB as Drizzle ORM
    participant A as Autorizador
    participant AL as AuditLog
    
    U->>UI: Preenche formulario de movimentacao
    UI->>S: POST moveEquipment(formData)
    S->>S: Validar permissoes
    S->>DB: Verificar se equipamento existe e esta disponivel
    DB-->>S: Dados do equipamento
    S->>S: Verificar se requer autorizacao (regra de negocio)
    alt Requer autorizacao
        S->>DB: Criar movement com status 'pending'
        DB-->>S: Movimentacao criada
        S->>AL: Registrar audit log (equipment.movement.requested)
        S-->>UI: Sucesso - aguardando autorizacao
        UI-->>U: Mensagem: "Movimentacao aguardando autorizacao"
        
        Note over A: Sistema notifica autorizador
        A->>UI: Acessa pagina de autorizacoes pendentes
        UI->>S: GET /equipment/movements/pending
        S->>DB: Buscar movimentacoes pendentes
        DB-->>S: Lista de movimentacoes
        S-->>UI: Dados das movimentacoes
        UI-->>A: Exibe lista de pendentes
        
        A->>UI: Aprova movimentacao
        UI->>S: POST authorizeMovement(movementId)
        S->>S: Validar se usuario e autorizador
        S->>DB: Atualizar movement (status='approved', authorized_by, authorized_at)
        S->>DB: Atualizar equipment (current_location_id, current_user_id)
        S->>AL: Registrar audit log (equipment.movement.approved)
        S-->>UI: Sucesso
        UI-->>A: Toast de sucesso
        UI-->>U: Notificacao de aprovacao (se configurado)
    else Nao requer autorizacao
        S->>DB: Criar movement com status 'completed'
        S->>DB: Atualizar equipment (current_location_id, current_user_id)
        S->>AL: Registrar audit log (equipment.movement.completed)
        S-->>UI: Sucesso
        UI-->>U: Toast de sucesso + atualiza lista
    end
```

#### Fluxo 4: Registro de Manutencao

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Autenticado
    participant UI as MaintenanceForm
    participant S as +page.server.ts (registerMaintenance)
    participant DB as Drizzle ORM
    participant AL as AuditLog
    
    U->>UI: Preenche formulario de manutencao
    UI->>S: POST registerMaintenance(formData)
    S->>S: Validar permissoes
    S->>S: Validar dados (equipment_id, type, description, start_date)
    S->>DB: Verificar se equipamento existe
    DB-->>S: Dados do equipamento
    S->>DB: Inserir equipment_maintenance
    DB-->>S: Manutencao criada
    alt Status e 'in_progress' ou 'scheduled'
        S->>DB: Atualizar equipment.status = 'maintenance'
    end
    S->>AL: Registrar audit log (equipment.maintenance.registered)
    AL-->>S: Log registrado
    S-->>UI: Sucesso com dados da manutencao
    UI-->>U: Toast de sucesso + atualiza status do equipamento
```

### Schema

A funcionalidade utiliza as seguintes tabelas:

#### Tabela: `equipment`

Armazena informacoes dos equipamentos:

- `id`: Identificador unico (PK)
- `code`: Codigo unico do equipamento (NOT NULL, UNIQUE)
- `name`: Nome/descricao (NOT NULL)
- `description`: Descricao detalhada
- `category`: Categoria (ex: informatica, mobiliario, etc)
- `brand`: Marca
- `model`: Modelo
- `serial_number`: Numero de serie
- `status`: Status do equipamento (available, in_use, maintenance, unavailable) - DEFAULT 'available'
- `current_location_id`: Referencia para localizacao atual (FK para location)
- `current_user_id`: Usuario atual responsavel (FK para user)
- `purchase_date`: Data de compra
- `purchase_value`: Valor em centavos
- `warranty_expiry`: Data de expiracao da garantia
- Campos de auditoria: `created_at`, `created_by_id`, `updated_at`, `updated_by_id`, `deleted_at`, `deleted_by_id`

#### Tabela: `location`

Armazena locais fisicos onde equipamentos podem estar:

- `id`: Identificador unico (PK)
- `name`: Nome do local (NOT NULL)
- `description`: Descricao
- `address`: Endereco completo (opcional)
- `building`: Predio/edificio
- `floor`: Andar
- `room`: Sala
- `is_active`: Indica se o local esta ativo (DEFAULT true)
- Campos de auditoria: `created_at`, `created_by_id`, `updated_at`, `deleted_at`

#### Tabela: `equipment_movement`

Registra todas as movimentacoes de equipamentos:

- `id`: Identificador unico (PK)
- `equipment_id`: Referencia ao equipamento (FK, NOT NULL)
- `from_location_id`: Local origem (FK para location)
- `to_location_id`: Local destino (FK para location)
- `from_user_id`: Usuario origem (FK para user)
- `to_user_id`: Usuario destino (FK para user)
- `requested_by_id`: Quem solicitou (FK para user, NOT NULL)
- `authorized_by_id`: Quem autorizou (FK para user)
- `status`: Status da movimentacao (pending, approved, rejected, completed) - DEFAULT 'pending'
- `reason`: Motivo da movimentacao
- `notes`: Observacoes adicionais
- `requested_at`: Data da solicitacao (NOT NULL, DEFAULT NOW)
- `authorized_at`: Data da autorizacao
- `completed_at`: Data da conclusao
- `created_at`: Data de criacao (NOT NULL, DEFAULT NOW)

#### Tabela: `equipment_maintenance`

Registra manutencoes de equipamentos:

- `id`: Identificador unico (PK)
- `equipment_id`: Referencia ao equipamento (FK, NOT NULL)
- `type`: Tipo de manutencao (preventive, corrective, calibration) - NOT NULL
- `description`: Descricao do servico (NOT NULL)
- `provider`: Fornecedor/prestador do servico
- `cost`: Custo em centavos
- `start_date`: Data de inicio (NOT NULL)
- `end_date`: Data de fim
- `status`: Status da manutencao (scheduled, in_progress, completed, cancelled) - DEFAULT 'scheduled'
- `next_maintenance_date`: Proxima data de manutencao (para manutencao preventiva)
- `notes`: Observacoes
- `registered_by_id`: Quem registrou (FK para user, NOT NULL)
- `created_at`: Data de criacao (NOT NULL, DEFAULT NOW)
- `updated_at`: Data de atualizacao

### Diagrama de Entidade-Relacionamento

```mermaid
erDiagram
    USER {
        TEXT id PK
        TEXT username "NOT NULL, UNIQUE"
        TEXT name
        TEXT password_hash
    }
    
    EQUIPMENT {
        TEXT id PK
        TEXT code "NOT NULL, UNIQUE"
        TEXT name "NOT NULL"
        TEXT description
        TEXT category
        TEXT brand
        TEXT model
        TEXT serial_number
        TEXT status "NOT NULL, DEFAULT 'available'"
        TEXT current_location_id FK
        TEXT current_user_id FK
        TIMESTAMPTZ created_at "NOT NULL"
        TEXT created_by_id FK
    }
    
    LOCATION {
        TEXT id PK
        TEXT name "NOT NULL"
        TEXT description
        TEXT address
        TEXT building
        TEXT floor
        TEXT room
        BOOLEAN is_active "DEFAULT true, NOT NULL"
        TIMESTAMPTZ created_at "NOT NULL"
        TEXT created_by_id FK
    }
    
    EQUIPMENT_MOVEMENT {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT from_location_id FK
        TEXT to_location_id FK
        TEXT from_user_id FK
        TEXT to_user_id FK
        TEXT requested_by_id FK "NOT NULL"
        TEXT authorized_by_id FK
        TEXT status "NOT NULL, DEFAULT 'pending'"
        TEXT reason
        TIMESTAMPTZ requested_at "NOT NULL"
        TIMESTAMPTZ authorized_at
        TIMESTAMPTZ completed_at
    }
    
    EQUIPMENT_MAINTENANCE {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT type "NOT NULL"
        TEXT description "NOT NULL"
        TEXT provider
        INTEGER cost
        TIMESTAMPTZ start_date "NOT NULL"
        TIMESTAMPTZ end_date
        TEXT status "NOT NULL, DEFAULT 'scheduled'"
        TIMESTAMPTZ next_maintenance_date
        TEXT registered_by_id FK "NOT NULL"
        TIMESTAMPTZ created_at "NOT NULL"
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
    USER ||--o{ EQUIPMENT_MOVEMENT : "from_user"
    USER ||--o{ EQUIPMENT_MOVEMENT : "to_user"
    USER ||--o{ EQUIPMENT_MAINTENANCE : "registered_by"
    LOCATION ||--o{ EQUIPMENT : "current_location"
    LOCATION ||--o{ EQUIPMENT_MOVEMENT : "from_location"
    LOCATION ||--o{ EQUIPMENT_MOVEMENT : "to_location"
    EQUIPMENT ||--o{ EQUIPMENT_MOVEMENT : "movements"
    EQUIPMENT ||--o{ EQUIPMENT_MAINTENANCE : "maintenances"
```

### Componentes

Componentes reutilizaveis em `src/lib/components/equipment/`:

- `EquipmentList.svelte`: Lista de equipamentos com filtros
- `EquipmentCard.svelte`: Card de exibicao de equipamento
- `EquipmentForm.svelte`: Formulario de criacao/edicao
- `MovementForm.svelte`: Formulario de movimentacao
- `MaintenanceForm.svelte`: Formulario de manutencao
- `MovementHistory.svelte`: Historico de movimentacoes
- `MaintenanceHistory.svelte`: Historico de manutencoes
- `LocationTracker.svelte`: Rastreamento de localizacao atual
- `AuthorizationDialog.svelte`: Dialogo de autorizacao de movimentacao

### Estrutura de Modulos

O sistema sera organizado no modulo `equipment` seguindo a arquitetura do projeto:

```
src/routes/equipment/
├── +page.svelte                    # Lista principal de equipamentos
├── +page.server.ts                 # Server-side logic e actions
├── page.server.spec.ts             # Testes unitarios
├── [id]/
│   ├── +page.svelte               # Detalhes do equipamento
│   ├── +page.server.ts            # Load de dados do equipamento
│   ├── page.server.spec.ts        # Testes
│   ├── move/
│   │   ├── +page.svelte           # Formulario de movimentacao
│   │   ├── +page.server.ts        # Action de movimentacao
│   │   └── page.server.spec.ts    # Testes
│   └── maintenance/
│       ├── +page.svelte           # Formulario de manutencao
│       ├── +page.server.ts        # Action de manutencao
│       └── page.server.spec.ts    # Testes
├── create/
│   ├── +page.svelte               # Formulario de criacao
│   ├── +page.server.ts            # Action de criacao
│   └── page.server.spec.ts        # Testes
└── utils.server.ts                 # Funcoes utilitarias
```

### Seguranca

- Validacao server-side: verificar permissoes do usuario (grupos)
- Validacao de dados: codigo unico, campos obrigatorios
- Soft delete: equipamentos nao sao removidos fisicamente, apenas marcados como deletados
- Auditoria completa: todas as operacoes sao registradas em `audit_log`
- Autorizacao de movimentacoes: sistema de aprovação para movimentacoes quando necessario

### Localizacao

Todas as strings estao internacionalizadas em `messages/pt-br.json` e sincronizadas com outros idiomas via `project.inlang`.
