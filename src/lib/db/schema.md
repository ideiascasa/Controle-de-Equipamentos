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

    USER ||--o{ SESSION : "has sessions"
    USER ||--o{ REL_GROUP : "member of"
    USER ||--o{ AUDIT_LOG : "performed by"
    USER ||--o{ LOCATION : "created_by"
    USER ||--o{ EQUIPMENT : "current_user"
    USER ||--o{ EQUIPMENT : "created_by"
    USER ||--o{ EQUIPMENT_MOVEMENT : "moved_by"
    USER ||--o{ EQUIPMENT_MOVEMENT : "authorized_by"
    USER ||--o{ EQUIPMENT_MOVEMENT : "from_user"
    USER ||--o{ EQUIPMENT_MOVEMENT : "to_user"
    USER ||--o{ EQUIPMENT_MAINTENANCE : "performed_by"
    USER ||--o{ EQUIPMENT_MAINTENANCE : "authorized_by"
    USER ||--o{ EQUIPMENT_MAINTENANCE : "created_by"
    GROUP ||--o{ REL_GROUP : "has members"
    LOCATION ||--o{ EQUIPMENT : "current_location"
    LOCATION ||--o{ EQUIPMENT_MOVEMENT : "from_location"
    LOCATION ||--o{ EQUIPMENT_MOVEMENT : "to_location"
    EQUIPMENT ||--o{ EQUIPMENT_MOVEMENT : "has_movements"
    EQUIPMENT ||--o{ EQUIPMENT_MAINTENANCE : "has_maintenances"
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

**LOCATION table:**
- location.id is the primary key (NOT NULL)
- location.name is NOT NULL
- location.description, location.address are nullable
- location.created_at defaults to now() and is NOT NULL (timestamp with timezone, mode: date)
- location.created_by_id → user.id (foreign key, optional/nullable)
- location.deleted_at and location.deleted_by_id are nullable (soft delete support)

**EQUIPMENT table:**
- equipment.id is the primary key (NOT NULL)
- equipment.name is NOT NULL
- equipment.serial_number is UNIQUE (nullable)
- equipment.status defaults to 'available' and is NOT NULL
- equipment.current_location_id → location.id (foreign key, optional/nullable)
- equipment.current_user_id → user.id (foreign key, optional/nullable)
- equipment.created_at defaults to now() and is NOT NULL (timestamp with timezone, mode: date)
- equipment.created_by_id → user.id (foreign key, optional/nullable)
- equipment.updated_at, equipment.deleted_at, equipment.deleted_by_id are nullable (soft delete support)

**EQUIPMENT_MOVEMENT table:**
- equipment_movement.id is the primary key (NOT NULL)
- equipment_movement.equipment_id → equipment.id (foreign key, required/NOT NULL)
- equipment_movement.to_location_id → location.id (foreign key, required/NOT NULL)
- equipment_movement.from_location_id → location.id (foreign key, optional/nullable)
- equipment_movement.moved_by_id → user.id (foreign key, required/NOT NULL)
- equipment_movement.from_user_id, equipment_movement.to_user_id, equipment_movement.authorized_by_id → user.id (foreign keys, optional/nullable)
- equipment_movement.status defaults to 'pending' and is NOT NULL
- equipment_movement.created_at defaults to now() and is NOT NULL (timestamp with timezone, mode: date)
- equipment_movement.completed_at is nullable

**EQUIPMENT_MAINTENANCE table:**
- equipment_maintenance.id is the primary key (NOT NULL)
- equipment_maintenance.equipment_id → equipment.id (foreign key, required/NOT NULL)
- equipment_maintenance.maintenance_type is NOT NULL
- equipment_maintenance.description is NOT NULL
- equipment_maintenance.created_by_id → user.id (foreign key, required/NOT NULL)
- equipment_maintenance.performed_by_id, equipment_maintenance.authorized_by_id → user.id (foreign keys, optional/nullable)
- equipment_maintenance.status defaults to 'scheduled' and is NOT NULL
- equipment_maintenance.cost is nullable (integer, stored in centavos)
- equipment_maintenance.start_date, equipment_maintenance.end_date are nullable (timestamp with timezone, mode: date)
- equipment_maintenance.created_at defaults to now() and is NOT NULL (timestamp with timezone, mode: date)
