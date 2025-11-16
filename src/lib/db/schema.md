# Database Schema (Mermaid)

> This document mirrors; Update this file whenever the TypeScript schema changes!

- src/lib/db/schema.ts (original)
- src/lib/db/schema.md (mirror)
- src/routes/doc/schema/+page.md (mirror)

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
    }

    REL_GROUP {
        TEXT group_id PK,FK "NOT NULL"
        TEXT user_id PK,FK "NOT NULL"
        BOOLEAN adm "DEFAULT false"
    }

    AUDIT_LOG {
        TEXT id PK
        TEXT action "NOT NULL"
        TEXT performed_by_id FK
        JSONB payload
        TIMESTAMPTZ created_at "DEFAULT now(), NOT NULL"
    }

    EQUIPMENT {
        TEXT id PK
        TEXT name "NOT NULL"
        TEXT description
        TEXT serial_number "UNIQUE"
        TEXT category
        TEXT status "NOT NULL, DEFAULT 'available'"
        TEXT current_location
        TEXT current_user_id FK
        TEXT group_id FK
        TEXT image_url
        JSONB metadata
        TIMESTAMPTZ created_at "NOT NULL"
        TEXT created_by_id FK
        TIMESTAMPTZ updated_at
        TEXT updated_by_id FK
        TIMESTAMPTZ deleted_at
        TEXT deleted_by_id FK
    }
    
    EQUIPMENT_MOVEMENT {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT from_location
        TEXT to_location "NOT NULL"
        TEXT from_user_id FK
        TEXT to_user_id FK
        TEXT status "NOT NULL, DEFAULT 'pending'"
        TEXT requested_by_id FK "NOT NULL"
        TEXT approved_by_id FK
        TIMESTAMPTZ approved_at
        TEXT completed_by_id FK
        TIMESTAMPTZ completed_at
        TEXT notes
        TIMESTAMPTZ created_at "NOT NULL"
        TIMESTAMPTZ updated_at
    }
    
    EQUIPMENT_LOCATION_HISTORY {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT movement_id FK
        TEXT location "NOT NULL"
        TEXT user_id FK
        TEXT action "NOT NULL"
        TEXT performed_by_id FK "NOT NULL"
        TEXT notes
        TIMESTAMPTZ created_at "NOT NULL"
    }
    
    EQUIPMENT_MAINTENANCE {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT maintenance_type "NOT NULL"
        TEXT description
        TIMESTAMPTZ scheduled_date
        TIMESTAMPTZ completed_date
        TEXT status "NOT NULL, DEFAULT 'scheduled'"
        TEXT assigned_to_id FK
        TEXT created_by_id FK "NOT NULL"
        TEXT notes
        TIMESTAMPTZ created_at "NOT NULL"
        TIMESTAMPTZ updated_at
    }

    USER ||--o{ SESSION : "has sessions"
    USER ||--o{ REL_GROUP : "member of"
    USER ||--o{ AUDIT_LOG : "performed by"
    GROUP ||--o{ REL_GROUP : "has members"
    USER ||--o{ EQUIPMENT : "current user"
    GROUP ||--o{ EQUIPMENT : "belongs to"
    USER ||--o{ EQUIPMENT_MOVEMENT : "requests"
    USER ||--o{ EQUIPMENT_MOVEMENT : "approves"
    USER ||--o{ EQUIPMENT_MOVEMENT : "completes"
    EQUIPMENT ||--o{ EQUIPMENT_MOVEMENT : "has movements"
    EQUIPMENT ||--o{ EQUIPMENT_LOCATION_HISTORY : "has history"
    EQUIPMENT_MOVEMENT ||--o{ EQUIPMENT_LOCATION_HISTORY : "generates"
    EQUIPMENT ||--o{ EQUIPMENT_MAINTENANCE : "has maintenance"
    USER ||--o{ EQUIPMENT_MAINTENANCE : "creates/assigns"
```

Details and constraints

**USER table:**
- user.id is the primary key (NOT NULL)
- user.username is UNIQUE and NOT NULL
- user.age, user.name, and user.password_hash are nullable

**SESSION table:**
- session.id is the primary key (NOT NULL)
- session.user_id → user.id (foreign key, required/NOT NULL)
- session.expires_at uses a timestamp with timezone (mode: date) and is NOT NULL

**GROUP table:**
- group.id is UNIQUE and serves as the primary key (NOT NULL)
- group.name and group.description are nullable

**REL_GROUP table:**
- rel_group has a composite primary key (group_id, user_id)
- rel_group.group_id → group.id (foreign key, required/NOT NULL)
- rel_group.user_id → user.id (foreign key, required/NOT NULL)
- rel_group.adm is a boolean flag indicating admin status (nullable, defaults to false)

**AUDIT_LOG table:**
- audit_log.id is the primary key (NOT NULL)
- audit_log.action is NOT NULL
- audit_log.performed_by_id → user.id (foreign key, optional/nullable)
- audit_log.payload is a JSONB field for storing metadata (nullable)
- audit_log.created_at defaults to now() and is NOT NULL (timestamp with timezone, mode: date)

**EQUIPMENT table:**
- equipment.id is the primary key (NOT NULL)
- equipment.name is NOT NULL
- equipment.serial_number is UNIQUE (nullable)
- equipment.status defaults to 'available' and is NOT NULL
- equipment.current_user_id → user.id (foreign key, nullable)
- equipment.group_id → group.id (foreign key, nullable)
- equipment.created_by_id → user.id (foreign key, nullable)
- equipment.updated_by_id → user.id (foreign key, nullable)
- equipment.deleted_by_id → user.id (foreign key, nullable)
- Supports soft delete via deleted_at and deleted_by_id

**EQUIPMENT_MOVEMENT table:**
- equipment_movement.id is the primary key (NOT NULL)
- equipment_movement.equipment_id → equipment.id (foreign key, required/NOT NULL)
- equipment_movement.to_location is NOT NULL
- equipment_movement.status defaults to 'pending' and is NOT NULL
- equipment_movement.requested_by_id → user.id (foreign key, required/NOT NULL)
- equipment_movement.approved_by_id → user.id (foreign key, nullable)
- equipment_movement.completed_by_id → user.id (foreign key, nullable)

**EQUIPMENT_LOCATION_HISTORY table:**
- equipment_location_history.id is the primary key (NOT NULL)
- equipment_location_history.equipment_id → equipment.id (foreign key, required/NOT NULL)
- equipment_location_history.movement_id → equipment_movement.id (foreign key, nullable)
- equipment_location_history.location is NOT NULL
- equipment_location_history.action is NOT NULL
- equipment_location_history.performed_by_id → user.id (foreign key, required/NOT NULL)

**EQUIPMENT_MAINTENANCE table:**
- equipment_maintenance.id is the primary key (NOT NULL)
- equipment_maintenance.equipment_id → equipment.id (foreign key, required/NOT NULL)
- equipment_maintenance.maintenance_type is NOT NULL
- equipment_maintenance.status defaults to 'scheduled' and is NOT NULL
- equipment_maintenance.created_by_id → user.id (foreign key, required/NOT NULL)
- equipment_maintenance.assigned_to_id → user.id (foreign key, nullable)
