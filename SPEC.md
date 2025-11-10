# Specification Document (use Mermaid.js, also use sequence diagrams)

> This document mirrors;

- SPEC.md
- src/routes/doc/spec/+page.md

---

## Gestao de grupos do usuario sistema

- Card novo em `user/profile` exibido somente quando `user.id === '1'`.
- Permite criar grupos com nome e descricao opcional, listar grupos ativos e acionar exclusao com confirmacao.
- Acoes usam `+page.server.ts` com validacao de permissao, feedback estruturado e auditoria em tabela dedicada.
- Todas as mensagens seguem traducoes em `messages/*` para manter consistencia multilingue.

```mermaid
sequenceDiagram
    actor Admin as Usuario sistema
    participant UI as Card de grupos
    participant Server as +page.server.ts
    participant DB as Drizzle
    Admin->>UI: Preenche formulario de grupo
    UI->>Server: POST createSystemGroup
    Server->>DB: Valida e insere grupo + auditoria
    DB-->>Server: Confirma criacao
    Server-->>UI: Retorna sucesso e dados do grupo
    UI-->>Admin: Atualiza lista e mostra feedback
```

```mermaid
sequenceDiagram
    actor Admin as Usuario sistema
    participant UI as Card de grupos
    participant Server as +page.server.ts
    participant DB as Drizzle
    Admin->>UI: Solicita excluir grupo
    UI->>Admin: Exibe dialogo de confirmacao
    Admin->>UI: Confirma exclusao
    UI->>Server: POST deleteSystemGroup
    Server->>DB: Soft delete grupo e registra auditoria
    DB-->>Server: Confirma exclusao
    Server-->>UI: Responde com mensagem padronizada
    UI-->>Admin: Remove grupo da lista e mostra toast
```