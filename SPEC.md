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

Sistema web completo para gestao de equipamentos com rastreamento de localizacao, historico de movimentacoes, controle de alocacoes e auditoria completa de todas as operacoes realizadas. Permite que usuarios cadastrem equipamentos, visualizem onde cada equipamento esta localizado, quem o alocou, quem autorizou a movimentacao e realizem movimentacoes de equipamentos.

### Requisitos

- Sistema web com autenticacao de usuarios
- Cadastro de equipamentos com informacoes detalhadas
- Visualizacao de localizacao atual de cada equipamento
- Rastreamento de quem alocou cada equipamento
- Rastreamento de quem autorizou cada movimentacao
- Funcionalidade de movimentacao de equipamentos
- Historico completo de movimentacoes
- Controle de permissoes baseado em grupos
- Auditoria completa de todas as operacoes

### Fluxos

#### Fluxo 1: Criacao de Equipamento

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Autenticado
    participant UI as EquipmentForm
    participant S as +page.server.ts (create)
    participant DB as Drizzle ORM
    participant A as AuditLog
    
    U->>UI: Preenche formulario de novo equipamento
    UI->>S: POST createEquipment(formData)
    S->>S: Valida permissoes (grupo/admin)
    S->>S: Valida dados (nome obrigatorio, etc.)
    S->>DB: Verifica serial_number unico (se fornecido)
    DB-->>S: Resultado validacao
    S->>DB: Insere em equipment
    DB-->>S: Equipamento criado
    S->>DB: Insere em equipment_location_history (criacao)
    S->>A: Registra audit_log ('equipment.created')
    A-->>S: Audit registrado
    S-->>UI: Retorna sucesso + dados do equipamento
    UI-->>U: Toast sucesso + redireciona para detalhes
```

#### Fluxo 2: Solicitacao de Movimentacao

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Solicitante
    participant UI as MovementForm
    participant S as +page.server.ts (createMovement)
    participant DB as Drizzle ORM
    participant N as Sistema de Notificacoes
    participant A as AuditLog
    
    U->>UI: Preenche formulario de movimentacao
    UI->>S: POST createMovement(formData)
    S->>S: Valida permissoes de movimentacao
    S->>DB: Verifica status do equipamento (deve estar disponivel ou alocado ao usuario)
    DB-->>S: Status do equipamento
    S->>DB: Insere em equipment_movement (status: pending)
    DB-->>S: Movimentacao criada
    S->>DB: Atualiza equipment.status para 'pending_movement'
    S->>A: Registra audit_log ('movement.requested')
    S->>N: Notifica aprovadores (usuarios com permissao de aprovacao)
    N-->>S: Notificacoes enviadas
    S-->>UI: Retorna sucesso
    UI-->>U: Toast sucesso + atualiza lista
```

#### Fluxo 3: Aprovacao de Movimentacao

```mermaid
sequenceDiagram
    autonumber
    participant A as Usuario Aprovador
    participant UI as ApprovalDialog
    participant S as +page.server.ts (approveMovement)
    participant DB as Drizzle ORM
    participant N as Sistema de Notificacoes
    participant H as LocationHistory
    participant AL as AuditLog
    
    A->>UI: Visualiza movimentacao pendente
    A->>UI: Clica em "Aprovar"
    UI->>S: POST approveMovement(movementId)
    S->>S: Valida permissoes de aprovacao
    S->>DB: Busca movimentacao e equipamento
    DB-->>S: Dados da movimentacao
    S->>DB: Atualiza equipment_movement (status: approved, approved_by, approved_at)
    S->>DB: Atualiza equipment (current_location, current_user_id, status: allocated)
    S->>H: Insere em equipment_location_history
    H-->>S: Historico registrado
    S->>AL: Registra audit_log ('movement.approved')
    S->>N: Notifica solicitante e usuario destino
    N-->>S: Notificacoes enviadas
    S-->>UI: Retorna sucesso
    UI-->>A: Toast sucesso + atualiza status
```

#### Fluxo 4: Completar Movimentacao

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario Executor
    participant UI as MovementDetails
    participant S as +page.server.ts (completeMovement)
    participant DB as Drizzle ORM
    participant H as LocationHistory
    participant AL as AuditLog
    
    U->>UI: Visualiza movimentacao aprovada
    U->>UI: Confirma recebimento/entrega
    UI->>S: POST completeMovement(movementId)
    S->>S: Valida permissoes (deve ser usuario destino ou aprovador)
    S->>DB: Verifica status da movimentacao (deve estar approved)
    DB-->>S: Status atual
    S->>DB: Atualiza equipment_movement (status: completed, completed_by, completed_at)
    S->>DB: Confirma equipment (current_location, current_user_id definitivos)
    S->>H: Insere em equipment_location_history (acao: completed)
    H-->>S: Historico atualizado
    S->>AL: Registra audit_log ('movement.completed')
    S-->>UI: Retorna sucesso
    UI-->>U: Toast sucesso + atualiza visualizacao
```

#### Fluxo 5: Visualizacao de Historico

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant UI as EquipmentDetails
    participant S as +page.server.ts (load)
    participant DB as Drizzle ORM
    
    U->>UI: Acessa pagina de detalhes do equipamento
    UI->>S: GET /equipment/[id]
    S->>S: Valida autenticacao
    S->>DB: Busca equipment por id
    DB-->>S: Dados do equipamento
    S->>DB: Busca equipment_location_history (ordenado por created_at DESC)
    DB-->>S: Historico completo
    S->>DB: Busca equipment_movement relacionadas
    DB-->>S: Movimentacoes
    S->>DB: Busca equipment_maintenance relacionadas
    DB-->>S: Manutencoes
    S-->>UI: Retorna dados agregados
    UI-->>U: Renderiza detalhes + timeline + movimentacoes + manutencoes
```

### Schema

A funcionalidade utiliza as seguintes tabelas:

- `equipment`: Armazena equipamentos com informacoes detalhadas (nome, descricao, numero de serie, categoria, status, localizacao atual, usuario atual, grupo, etc.)
- `equipment_movement`: Registro de movimentacoes de equipamentos com status (pending, approved, rejected, completed, cancelled)
- `equipment_location_history`: Historico completo de localizacoes e acoes realizadas em cada equipamento
- `equipment_maintenance`: Registro de manutencoes agendadas e realizadas

### Componentes

- `EquipmentCard.svelte`: Card de equipamento na lista
- `EquipmentList.svelte`: Lista de equipamentos
- `EquipmentForm.svelte`: Formulario de criacao/edicao
- `EquipmentDetails.svelte`: Visualizacao detalhada
- `EquipmentStatusBadge.svelte`: Badge de status
- `MovementCard.svelte`: Card de movimentacao
- `MovementList.svelte`: Lista de movimentacoes
- `MovementForm.svelte`: Formulario de movimentacao
- `MovementTimeline.svelte`: Timeline do historico
- `LocationSelector.svelte`: Seletor de localizacao
- `ApprovalDialog.svelte`: Dialogo de aprovacao

### Seguranca

- Validacao server-side: permissoes baseadas em grupos
- Validacao de dados: nome obrigatorio, serial_number unico (se fornecido)
- Soft delete: equipamentos nao sao removidos fisicamente
- Auditoria completa: todas as operacoes sao registradas em `audit_log`
- Controle de acesso: usuarios veem apenas equipamentos do seu grupo (a menos que sejam admin)

### Regras de Negocio

1. **Visualizacao de Equipamentos:**
   - Todos os usuarios autenticados podem visualizar equipamentos
   - Filtros baseados em grupos (usuario ve apenas equipamentos do seu grupo, a menos que seja admin)

2. **Criacao de Equipamentos:**
   - Apenas usuarios com permissao de administrador de grupo ou sistema
   - Validacao: nome obrigatorio, serial_number unico (se fornecido)

3. **Movimentacao de Equipamentos:**
   - Usuarios podem solicitar movimentacao de equipamentos disponiveis ou alocados a eles
   - Aprovacao requerida de usuarios com permissao de aprovacao (configuravel por grupo)
   - Apenas aprovadores podem aprovar movimentacoes pendentes
   - Usuario destino ou aprovador pode completar a movimentacao

4. **Edicao de Equipamentos:**
   - Apenas criador ou administradores de grupo
   - Soft delete: equipamentos nao sao removidos fisicamente

### Localizacao

Todas as strings estao internacionalizadas em `messages/pt-br.json` e sincronizadas com outros idiomas via `project.inlang`.