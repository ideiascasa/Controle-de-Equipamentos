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
    }

    REL_GROUP {
        TEXT group_id PK,FK "NOT NULL"
        TEXT user_id PK,FK "NOT NULL"
        BOOLEAN adm "DEFAULT false"
    }

    LOCATION {
        UUID id PK
        TEXT name "NOT NULL"
        UUID parent_id FK
        LOCATION_TYPE type "NOT NULL"
        TEXT timezone
        BOOLEAN is_active "NOT NULL, DEFAULT true"
        TIMESTAMPTZ created_at "DEFAULT now"
        TIMESTAMPTZ updated_at "DEFAULT now"
    }

    EQUIPMENT {
        UUID id PK
        TEXT asset_code "NOT NULL, UNIQUE"
        TEXT name "NOT NULL"
        TEXT description
        TEXT category
        EQUIPMENT_CRITICALITY criticality "NOT NULL, DEFAULT media"
        EQUIPMENT_STATUS status "NOT NULL, DEFAULT ativo"
        UUID location_id FK
        TEXT custodian_user_id FK
        TIMESTAMPTZ acquisition_date
        TIMESTAMPTZ depreciation_end
        JSONB metadata
        TIMESTAMPTZ created_at "DEFAULT now"
        TIMESTAMPTZ updated_at "DEFAULT now"
    }

    EQUIPMENT_MOVEMENT {
        UUID id PK
        UUID equipment_id FK "NOT NULL"
        TEXT requested_by_user_id FK "NOT NULL"
        TEXT authorized_by_user_id FK
        UUID origin_location_id FK
        UUID target_location_id FK "NOT NULL"
        EQUIPMENT_MOVEMENT_STATUS status "NOT NULL, DEFAULT pendente"
        TEXT authorization_note
        TEXT movement_note
        TIMESTAMPTZ requested_at "DEFAULT now"
        TIMESTAMPTZ authorized_at
        TIMESTAMPTZ executed_at
        JSONB payload
        TIMESTAMPTZ created_at "DEFAULT now"
        TIMESTAMPTZ updated_at "DEFAULT now"
    }

    EQUIPMENT_MAINTENANCE {
        UUID id PK
        UUID equipment_id FK "NOT NULL"
        EQUIPMENT_MAINTENANCE_TYPE type "NOT NULL"
        TIMESTAMPTZ scheduled_for
        TIMESTAMPTZ started_at
        TIMESTAMPTZ completed_at
        TEXT technician_user_id FK
        TEXT result_note
        EQUIPMENT_STATUS status "NOT NULL, DEFAULT em_manutencao"
        JSONB attachments
        TIMESTAMPTZ created_at "DEFAULT now"
        TIMESTAMPTZ updated_at "DEFAULT now"
    }

    EQUIPMENT_AUDIT_LOG {
        UUID id PK
        UUID equipment_id FK "NOT NULL"
        EQUIPMENT_AUDIT_EVENT event_type "NOT NULL"
        JSONB payload
        TEXT actor_user_id FK
        TIMESTAMPTZ created_at "DEFAULT now"
    }

    MOVEMENT_POLICY {
        UUID id PK
        TEXT name "NOT NULL"
        MOVEMENT_POLICY_SCOPE scope "NOT NULL"
        TEXT role
        UUID location_id FK
        TEXT category
        BOOLEAN requires_approval "NOT NULL, DEFAULT true"
        TIMESTAMPTZ created_at "DEFAULT now"
        TIMESTAMPTZ updated_at "DEFAULT now"
    }

    USER ||--o{ SESSION : "has sessions"
    USER ||--o{ REL_GROUP : "member of"
    GROUP ||--o{ REL_GROUP : "has members"
    LOCATION ||--o{ LOCATION : "parent of"
    LOCATION ||--o{ EQUIPMENT : "aloca"
    USER ||--o{ EQUIPMENT : "custodia"
    EQUIPMENT ||--o{ EQUIPMENT_MOVEMENT : "movimenta"
    EQUIPMENT ||--o{ EQUIPMENT_MAINTENANCE : "entra_em_manutencao"
    EQUIPMENT ||--o{ EQUIPMENT_AUDIT_LOG : "gera_evento"
    USER ||--o{ EQUIPMENT_MOVEMENT : "solicita"
    USER ||--o{ EQUIPMENT_MOVEMENT : "autoriza"
    USER ||--o{ EQUIPMENT_MAINTENANCE : "executa"
    MOVEMENT_POLICY ||--o{ EQUIPMENT_MOVEMENT : "governa"
    LOCATION ||--o{ MOVEMENT_POLICY : "escopo"
```

Details and constraints

- session.user_id → user.id (foreign key, required)
- user.username is UNIQUE and NOT NULL
- session.expires_at uses a timestamp with timezone (mode: date) and is NOT NULL
- group.id is UNIQUE and serves as the primary key
- rel_group has a composite primary key (group_id, user_id)
- rel_group.group_id → group.id (foreign key, required)
- rel_group.user_id → user.id (foreign key, required)
- rel_group.adm is a boolean flag indicating admin status
- location.parent_id → location.id (self reference, optional)
- equipment.location_id → location.id (optional)
- equipment.custodian_user_id → user.id (optional)
- equipment_movement.equipment_id → equipment.id (required)
- equipment_movement.requested_by_user_id → user.id (required)
- equipment_movement.authorized_by_user_id → user.id (optional)
- equipment_movement.origin_location_id → location.id (optional)
- equipment_movement.target_location_id → location.id (required)
- equipment_maintenance.equipment_id → equipment.id (required)
- equipment_maintenance.technician_user_id → user.id (optional)
- equipment_audit_log.equipment_id → equipment.id (required)
- equipment_audit_log.actor_user_id → user.id (optional)
- movement_policy.location_id → location.id (optional)
- Enumerations: equipment_status, equipment_criticality, equipment_movement_status, equipment_maintenance_type, equipment_audit_event, location_type, movement_policy_scope
