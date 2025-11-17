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

Sistema web para gestao completa de equipamentos com as seguintes funcionalidades:

* Interface web responsiva
* Autenticacao de usuarios (login e senha)
* Cadastro completo de equipamentos com informacoes detalhadas
* Visualizacao da localizacao atual de cada equipamento
* Rastreamento de quem alocou e quem autorizou cada movimentacao
* Sistema de solicitacao e autorizacao de movimentacoes de equipamentos
* Registro e acompanhamento de manutencoes de equipamentos

### Requisitos

- Cadastro de equipamentos com codigo unico, nome, descricao, categoria, marca, modelo, numero de serie, numero de patrimonio
- Gestao de localizacoes (predio, andar, sala, endereco)
- Sistema de movimentacao com solicitacao, autorizacao e conclusao
- Registro de manutencoes (preventiva, corretiva, preditiva)
- Historico completo de movimentacoes e manutencoes
- Rastreamento de responsaveis (quem alocou, quem autorizou)
- Auditoria completa de todas as operacoes

### Fluxos

#### Fluxo: Cadastro de Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant UI as EquipmentForm
    participant S as +page.server.ts (createEquipment)
    participant DB as Drizzle ORM
    participant A as AuditLog
    
    U->>UI: Preenche formulario de cadastro
    UI->>S: POST createEquipment(formData)
    S->>S: Validar permissoes (usuario autenticado)
    S->>S: Validar dados (codigo unico, campos obrigatorios)
    S->>DB: Verificar se codigo ja existe
    DB-->>S: Resultado da verificacao
    alt Codigo ja existe
        S-->>UI: Erro: Codigo duplicado
    else Codigo disponivel
        S->>DB: Inserir equipamento em equipment
        DB-->>S: Equipamento criado
        S->>DB: Atualizar localizacao inicial (se fornecida)
        S->>A: Registrar audit log (equipment.create)
        S-->>UI: Sucesso + dados do equipamento
        UI-->>U: Toast de sucesso + redireciona para detalhes
    end
```

#### Fluxo: Movimentacao de Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Solicitante
    participant UI as MovementForm
    participant S as +page.server.ts (requestMovement)
    participant DB as Drizzle ORM
    participant A as AuditLog
    participant Admin as Usuario Autorizador
    participant Notif as Sistema de Notificacao
    
    U->>UI: Preenche formulario de movimentacao
    UI->>S: POST requestMovement(equipmentId, toLocationId, reason)
    S->>S: Validar permissoes e dados
    S->>DB: Buscar equipamento atual
    DB-->>S: Dados do equipamento
    S->>DB: Criar registro em equipment_movement (status: pending)
    DB-->>S: Movimentacao criada
    S->>A: Registrar audit log (equipment.movement.requested)
    
    alt Requer autorizacao
        S->>Notif: Notificar administradores
        Notif-->>Admin: Notificacao de movimentacao pendente
        Admin->>S: POST approveMovement(movementId)
        S->>DB: Atualizar status para 'approved' e authorized_by_id
        S->>A: Registrar audit log (equipment.movement.approved)
        S-->>Admin: Confirmacao de aprovacao
    end
    
    S->>DB: Atualizar equipment (current_location_id, current_user_id)
    S->>DB: Atualizar movement (status: completed, completed_at)
    S->>A: Registrar audit log (equipment.movement.completed)
    S-->>UI: Sucesso
    UI-->>U: Toast de sucesso + atualiza visualizacao
```

#### Fluxo: Registro de Manutencao

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant UI as MaintenanceForm
    participant S as +page.server.ts (createMaintenance)
    participant DB as Drizzle ORM
    participant A as AuditLog
    
    U->>UI: Preenche formulario de manutencao
    UI->>S: POST createMaintenance(equipmentId, type, description, dates)
    S->>S: Validar permissoes e dados
    S->>DB: Verificar se equipamento existe
    DB-->>S: Dados do equipamento
    
    alt Equipamento nao encontrado
        S-->>UI: Erro: Equipamento nao encontrado
    else Equipamento encontrado
        S->>DB: Criar registro em equipment_maintenance
        DB-->>S: Manutencao criada
        S->>DB: Atualizar status do equipamento para 'maintenance' (se necessario)
        S->>A: Registrar audit log (equipment.maintenance.created)
        S-->>UI: Sucesso + dados da manutencao
        UI-->>U: Toast de sucesso + atualiza historico
    end
```

### Schema

#### Tabela: `equipment` (Equipamentos)

- `id`: Identificador unico (PK)
- `code`: Codigo unico do equipamento (NOT NULL, UNIQUE)
- `name`: Nome do equipamento (NOT NULL)
- `description`: Descricao detalhada
- `category`: Categoria (ex: Informatica, Mobiliario, etc)
- `brand`: Marca
- `model`: Modelo
- `serialNumber`: Numero de serie
- `patrimonyNumber`: Numero de patrimonio
- `purchaseDate`: Data de compra
- `purchaseValue`: Valor de compra
- `supplier`: Fornecedor
- `warrantyExpiry`: Fim da garantia
- `status`: Status (available, in_use, maintenance, retired) - DEFAULT 'available'
- `currentLocationId`: Localizacao atual (FK para location)
- `currentUserId`: Usuario responsavel atual (FK para user)
- `notes`: Observacoes gerais
- Campos de auditoria: `createdAt`, `createdById`, `updatedAt`, `updatedById`, `deletedAt`, `deletedById`

#### Tabela: `location` (Localizacoes)

- `id`: Identificador unico (PK)
- `name`: Nome da localizacao (NOT NULL)
- `description`: Descricao da localizacao
- `address`: Endereco completo
- `building`: Predio
- `floor`: Andar
- `room`: Sala
- `isActive`: Status ativo (DEFAULT true)
- Campos de auditoria: `createdAt`, `createdById`, `updatedAt`, `updatedById`

#### Tabela: `equipment_movement` (Movimentacoes)

- `id`: Identificador unico (PK)
- `equipmentId`: Equipamento (FK, NOT NULL)
- `fromLocationId`: Localizacao origem (FK)
- `toLocationId`: Localizacao destino (FK, NOT NULL)
- `fromUserId`: Usuario origem (FK)
- `toUserId`: Usuario destino (FK)
- `requestedById`: Quem solicitou (FK, NOT NULL)
- `authorizedById`: Quem autorizou (FK)
- `status`: Status (pending, approved, rejected, completed) - DEFAULT 'pending'
- `reason`: Motivo da movimentacao
- `requestedAt`: Data da solicitacao (NOT NULL)
- `authorizedAt`: Data da autorizacao
- `completedAt`: Data da conclusao
- `notes`: Observacoes
- `createdAt`: Data de criacao (NOT NULL)

#### Tabela: `equipment_maintenance` (Manutencoes)

- `id`: Identificador unico (PK)
- `equipmentId`: Equipamento (FK, NOT NULL)
- `type`: Tipo (preventive, corrective, predictive) - NOT NULL
- `description`: Descricao da manutencao (NOT NULL)
- `cost`: Custo da manutencao
- `supplier`: Fornecedor/prestador do servico
- `startDate`: Data de inicio (NOT NULL)
- `endDate`: Data de fim
- `nextMaintenanceDate`: Proxima manutencao
- `status`: Status (scheduled, in_progress, completed, cancelled) - DEFAULT 'scheduled'
- `performedById`: Quem realizou (FK)
- `registeredById`: Quem registrou (FK, NOT NULL)
- `notes`: Observacoes
- `createdAt`: Data de criacao (NOT NULL)

### Componentes

#### Paginas

- `/equipment`: Listagem de equipamentos com filtros e busca
- `/equipment/[id]`: Detalhes do equipamento com historico
- `/equipment/new`: Cadastro de novo equipamento
- `/equipment/[id]/edit`: Edicao de equipamento
- `/equipment/[id]/move`: Movimentacao de equipamento
- `/equipment/[id]/maintenance`: Registro de manutencao
- `/equipment/history`: Historico e relatorios

#### Componentes Svelte

- `EquipmentList.svelte`: Lista principal de equipamentos
- `EquipmentCard.svelte`: Card individual de equipamento
- `EquipmentFilters.svelte`: Filtros e busca
- `EquipmentForm.svelte`: Formulario de cadastro/edicao
- `MovementForm.svelte`: Formulario de movimentacao
- `MaintenanceForm.svelte`: Formulario de manutencao
- `EquipmentDetails.svelte`: Detalhes do equipamento
- `MovementHistory.svelte`: Historico de movimentacoes
- `MaintenanceHistory.svelte`: Historico de manutencoes
- `LocationSelector.svelte`: Seletor de localizacao
- `MovementApprovalDialog.svelte`: Dialogo de aprovacao

### Seguranca

- Validacao server-side: apenas usuarios autenticados podem acessar
- Validacao de dados: codigo unico obrigatorio, campos validados
- Soft delete: equipamentos nao sao removidos fisicamente
- Auditoria completa: todas as operacoes sao registradas em `audit_log`
- Controle de permissoes: movimentacoes podem requerer autorizacao

### Localizacao

Todas as strings estao internacionalizadas em `messages/pt-br.json` e sincronizadas com outros idiomas via `project.inlang`.
