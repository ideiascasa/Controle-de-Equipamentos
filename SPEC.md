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

Sistema web completo de gestao de equipamentos que permite aos usuarios cadastrar equipamentos, visualizar localizacao atual, rastrear movimentacoes, identificar quem alocou e autorizou movimentacoes, realizar movimentacoes entre locais/usuarios, e registrar/acompanhar manutencoes preventivas e corretivas.

### Requisitos

- Interface web acessivel via navegador
- Autenticacao de usuarios com login e senha
- Cadastro completo de equipamentos com informacoes detalhadas
- Visualizacao da localizacao atual de cada equipamento
- Rastreamento de quem alocou cada equipamento
- Registro de quem autorizou cada movimentacao
- Movimentacao de equipamentos entre locais e/ou usuarios
- Cadastro e gestao de manutencoes de equipamentos
- Historico completo de movimentacoes e manutencoes
- Auditoria completa de todas as acoes

### Fluxos

#### Fluxo de Cadastro de Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Autenticado
    participant UI as Formulario de Cadastro
    participant S as +page.server.ts (action createEquipment)
    participant DB as Drizzle ORM
    participant A as Audit Log
    
    U->>UI: Preenche dados do equipamento
    UI->>S: POST createEquipment(formData)
    S->>S: Validar autenticacao e permissoes
    S->>S: Validar dados (nome obrigatorio, serial unico)
    S->>DB: Inserir equipamento
    DB-->>S: Retorna equipamento criado
    S->>A: Registrar audit log (equipment.create)
    A-->>S: Confirmacao
    S-->>UI: Retorna sucesso com dados do equipamento
    UI-->>U: Toast de sucesso + redireciona para detalhes
```

#### Fluxo de Movimentacao de Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Autenticado
    participant UI as Formulario de Movimentacao
    participant S as +page.server.ts (action moveEquipment)
    participant DB as Drizzle ORM
    participant A as Audit Log
    
    U->>UI: Seleciona equipamento e destino
    UI->>S: POST moveEquipment(equipmentId, toLocationId, toUserId)
    S->>S: Validar autenticacao
    S->>DB: Verificar se equipamento existe e esta disponivel
    DB-->>S: Dados do equipamento
    S->>S: Verificar se usuario tem permissao para mover
    alt Requer autorizacao de administrador
        S->>S: Verificar se authorized_by_id e admin
        S->>DB: Verificar grupo admin do autorizador
    end
    S->>DB: Iniciar transacao
    S->>DB: Criar registro de movimentacao
    S->>DB: Atualizar current_location_id e current_user_id do equipamento
    S->>A: Registrar audit log (equipment.move)
    S->>DB: Commit transacao
    DB-->>S: Confirmacao
    S-->>UI: Retorna sucesso
    UI-->>U: Toast de sucesso + atualiza visualizacao
```

#### Fluxo de Visualizacao de Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Autenticado
    participant UI as Pagina de Detalhes
    participant S as +page.server.ts (load function)
    participant DB as Drizzle ORM
    
    U->>UI: Acessa /equipment/[id]
    UI->>S: GET /equipment/[id]
    S->>S: Validar autenticacao
    S->>DB: Buscar equipamento por ID
    DB-->>S: Dados do equipamento
    S->>DB: Buscar localizacao atual (JOIN com location)
    S->>DB: Buscar usuario atual (JOIN com user)
    S->>DB: Buscar historico de movimentacoes (equipment_movement)
    S->>DB: Buscar historico de manutencoes (equipment_maintenance)
    DB-->>S: Dados agregados
    S-->>UI: Retorna dados completos
    UI-->>U: Exibe informacoes, historico e acoes disponiveis
```

#### Fluxo de Cadastro de Manutencao

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Autenticado
    participant UI as Formulario de Manutencao
    participant S as +page.server.ts (action createMaintenance)
    participant DB as Drizzle ORM
    participant A as Audit Log
    
    U->>UI: Preenche dados da manutencao
    UI->>S: POST createMaintenance(equipmentId, maintenanceData)
    S->>S: Validar autenticacao
    S->>DB: Verificar se equipamento existe
    DB-->>S: Dados do equipamento
    S->>S: Validar dados (tipo, descricao obrigatoria)
    S->>DB: Inserir registro de manutencao
    S->>DB: Atualizar status do equipamento para "maintenance" (se necessario)
    S->>A: Registrar audit log (equipment.maintenance.create)
    DB-->>S: Confirmacao
    S-->>UI: Retorna sucesso
    UI-->>U: Toast de sucesso + atualiza lista
```

#### Fluxo de Listagem de Equipamentos

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Autenticado
    participant UI as Pagina de Listagem
    participant S as +page.server.ts (load function)
    participant DB as Drizzle ORM
    
    U->>UI: Acessa /equipment
    UI->>S: GET /equipment
    S->>S: Validar autenticacao
    S->>DB: Buscar equipamentos (com filtros opcionais)
    Note over DB: JOIN com location e user para<br/>localizacao e usuario atual
    DB-->>S: Lista de equipamentos com dados relacionados
    S->>S: Aplicar filtros de permissao (se necessario)
    S-->>UI: Retorna lista paginada
    UI-->>U: Exibe tabela/cards com equipamentos
    U->>UI: Aplica filtros (status, categoria, localizacao)
    UI->>S: GET /equipment?status=in_use&location=...
    S->>DB: Buscar com filtros aplicados
    DB-->>S: Resultados filtrados
    S-->>UI: Retorna lista atualizada
    UI-->>U: Exibe resultados filtrados
```

### Schema

#### Tabelas do Banco de Dados

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
        TEXT description
        TEXT serial_number "UNIQUE"
        TEXT category
        TEXT status "NOT NULL, DEFAULT 'available'"
        TEXT current_location_id FK
        TEXT current_user_id FK
        TIMESTAMPTZ created_at "NOT NULL"
        TEXT created_by_id FK "NOT NULL"
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
        TEXT created_by_id FK "NOT NULL"
        TIMESTAMPTZ deleted_at
        TEXT deleted_by_id FK
    }
    
    EQUIPMENT_MOVEMENT {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT from_location_id FK
        TEXT from_user_id FK
        TEXT to_location_id FK
        TEXT to_user_id FK
        TEXT moved_by_id FK "NOT NULL"
        TEXT authorized_by_id FK
        TEXT reason
        TEXT notes
        TIMESTAMPTZ created_at "NOT NULL"
    }
    
    EQUIPMENT_MAINTENANCE {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT maintenance_type "NOT NULL"
        TEXT status "NOT NULL, DEFAULT 'scheduled'"
        TIMESTAMPTZ scheduled_date
        TIMESTAMPTZ start_date
        TIMESTAMPTZ completed_date
        TEXT description "NOT NULL"
        TEXT technician
        NUMERIC cost
        TEXT notes
        TEXT created_by_id FK "NOT NULL"
        TIMESTAMPTZ created_at "NOT NULL"
        TIMESTAMPTZ updated_at
    }
    
    AUDIT_LOG {
        TEXT id PK
        TEXT action "NOT NULL"
        TEXT performed_by_id FK
        JSONB payload
        TIMESTAMPTZ created_at "NOT NULL"
    }
    
    USER ||--o{ EQUIPMENT : "current_user"
    USER ||--o{ EQUIPMENT : "created_by"
    USER ||--o{ EQUIPMENT_MOVEMENT : "moved_by"
    USER ||--o{ EQUIPMENT_MOVEMENT : "authorized_by"
    USER ||--o{ EQUIPMENT_MAINTENANCE : "created_by"
    LOCATION ||--o{ EQUIPMENT : "current_location"
    LOCATION ||--o{ EQUIPMENT_MOVEMENT : "from_location"
    LOCATION ||--o{ EQUIPMENT_MOVEMENT : "to_location"
    EQUIPMENT ||--o{ EQUIPMENT_MOVEMENT : "has movements"
    EQUIPMENT ||--o{ EQUIPMENT_MAINTENANCE : "has maintenances"
    USER ||--o{ AUDIT_LOG : "performed by"
```

### Estrutura de Modulos

O sistema sera implementado como um novo modulo seguindo o padrao do projeto em `src/routes/equipment/`.

```
src/routes/equipment/
├── +page.server.ts          # Server-side logic principal
├── +page.svelte             # Pagina de listagem de equipamentos
├── page.server.spec.ts      # Testes unitarios do servidor
├── page.spec.ts             # Testes unitarios do cliente
├── [id]/
│   ├── +page.server.ts      # Detalhes do equipamento
│   ├── +page.svelte         # Visualizacao de detalhes
│   ├── page.server.spec.ts
│   └── page.spec.ts
├── create/
│   ├── +page.server.ts      # Criacao de equipamento
│   ├── +page.svelte         # Formulario de criacao
│   └── page.server.spec.ts
├── move/
│   ├── +page.server.ts      # Movimentacao de equipamento
│   ├── +page.svelte         # Formulario de movimentacao
│   └── page.server.spec.ts
├── maintenance/
│   ├── +page.server.ts      # Gestao de manutencoes
│   ├── +page.svelte         # Lista de manutencoes
│   ├── [id]/
│   │   ├── +page.server.ts  # Detalhes da manutencao
│   │   └── +page.svelte
│   └── create/
│       ├── +page.server.ts  # Criar manutencao
│       └── +page.svelte
└── utils.server.ts          # Funcoes auxiliares do servidor
```

### Componentes

#### Componentes Principais

```
src/lib/components/equipment/
├── EquipmentList.svelte          # Lista de equipamentos (tabela/cards)
├── EquipmentCard.svelte           # Card individual de equipamento
├── EquipmentForm.svelte           # Formulario de criacao/edicao
├── EquipmentDetails.svelte       # Visualizacao de detalhes
├── EquipmentMovementForm.svelte   # Formulario de movimentacao
├── EquipmentMovementHistory.svelte # Historico de movimentacoes
├── MaintenanceList.svelte         # Lista de manutencoes
├── MaintenanceForm.svelte         # Formulario de manutencao
├── MaintenanceCard.svelte         # Card de manutencao
└── LocationSelector.svelte        # Seletor de localizacao
```

### Permissoes e Seguranca

#### Regras de Permissao

- **Visualizacao**: Todos os usuarios autenticados podem ver equipamentos
- **Criacao**: Apenas usuarios com permissao de administrador ou grupo especifico
- **Movimentacao**: Usuarios podem mover equipamentos, mas pode requerer autorizacao de admin dependendo da configuracao
- **Manutencao**: Usuarios podem criar manutencoes, admins podem editar/cancelar
- **Exclusao**: Apenas administradores (soft delete)

#### Validacoes Server-Side

- Todas as validacoes devem ser feitas no servidor (`+page.server.ts`)
- Validar existencia de equipamentos, locais e usuarios antes de operacoes
- Verificar permissoes antes de cada acao
- Usar transacoes para operacoes que modificam multiplas tabelas

### Auditoria

Todas as acoes devem ser registradas no `audit_log`:

- `equipment.create`
- `equipment.update`
- `equipment.delete`
- `equipment.move`
- `equipment.maintenance.create`
- `equipment.maintenance.update`
- `equipment.maintenance.complete`
- `location.create`
- `location.update`
- `location.delete`

### Localizacao

Todas as strings devem ser adicionadas em `messages/pt-br.json` e sincronizadas via `project.inlang/settings.json`.

### Testes

#### Testes Unitarios

- `src/routes/equipment/page.server.spec.ts`: Testar load e actions
- `src/routes/equipment/[id]/page.server.spec.ts`: Testar detalhes
- `src/routes/equipment/create/page.server.spec.ts`: Testar criacao
- `src/routes/equipment/move/page.server.spec.ts`: Testar movimentacao
- `src/routes/equipment/maintenance/page.server.spec.ts`: Testar manutencoes

#### Testes End-to-End

- `e2e/equipment.test.ts`: Fluxo completo de criacao, movimentacao e manutencao

### Melhores Praticas Aplicadas

1. **Rastreabilidade Completa**: Todo equipamento tem historico completo de movimentacoes
2. **Soft Delete**: Equipamentos nao sao removidos fisicamente, apenas marcados como deletados
3. **Status Management**: Estados claros (disponivel, em uso, em manutencao, aposentado)
4. **Autorizacao de Movimentacao**: Sistema de autorizacao para movimentacoes importantes
5. **Manutencao Preventiva**: Suporte a manutencoes agendadas com alertas
6. **Localizacao Hierarquica**: Suporte a locais com enderecos e descricoes
7. **Auditoria Completa**: Todas as acoes sao registradas para compliance
