# Database Schema (Mermaid)

> This document mirrors; Update this file whenever the TypeScript schema changes!

- src/lib/db/schema.ts.
- src/routes/doc/schema/+page.md

```mermaid
erDiagram
    USER {
        TEXT id PK
        INT age
        TEXT name
        TEXT username "NOT NULL, UNIQUE"
        TEXT password_hash
    }

    SESSION {
        TEXT id PK
        TEXT user_id FK "NOT NULL"
        TIMESTAMPTZ expires_at "NOT NULL"
    }

    GROUP {
        TEXT id PK "UNIQUE"
        TEXT name
        TEXT description
        TIMESTAMPTZ created_at "DEFAULT now(), NOT NULL"
        TEXT created_by_id FK
        TIMESTAMPTZ deleted_at
        TEXT deleted_by_id FK
    }

    REL_GROUP {
        TEXT group_id PK,FK "NOT NULL"
        TEXT user_id PK,FK "NOT NULL"
        BOOLEAN adm "DEFAULT false"
        TEXT role "DEFAULT member"
        TIMESTAMPTZ joined_at "DEFAULT now(), NOT NULL"
        TEXT created_by_id FK
    }

    GROUP_AUDIT_LOG {
        TEXT id PK
        TEXT group_id FK "NOT NULL"
        TEXT action "NOT NULL"
        TEXT performed_by_id FK
        JSONB payload
        TIMESTAMPTZ created_at "DEFAULT now(), NOT NULL"
    }

    USER ||--o{ SESSION : "has sessions"
    USER ||--o{ REL_GROUP : "member of"
    GROUP ||--o{ REL_GROUP : "has members"
    GROUP ||--o{ GROUP_AUDIT_LOG : "has audit"
    USER ||--o{ GROUP_AUDIT_LOG : "records"
```

Details and constraints

- session.user_id → user.id (foreign key, required)
- user.username is UNIQUE and NOT NULL
- session.expires_at uses a timestamp with timezone (mode: date) and is NOT NULL
- group.id is UNIQUE and serves as the primary key
- group.created_by_id → user.id
- group.deleted_by_id → user.id
- rel_group has a composite primary key (group_id, user_id)
- rel_group.group_id → group.id (foreign key, required)
- rel_group.user_id → user.id (foreign key, required)
- rel_group.created_by_id → user.id
- rel_group.adm e role definem papel do usuario no grupo
- group_audit_log.group_id → group.id (foreign key, required)
- group_audit_log.performed_by_id → user.id
