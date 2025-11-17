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
        TEXT building
        TEXT floor
        TEXT room
        BOOLEAN is_active "DEFAULT true"
        TEXT created_by_id FK
        TIMESTAMPTZ created_at "DEFAULT now(), NOT NULL"
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ deleted_at
        TEXT deleted_by_id FK
    }

    EQUIPMENT {
        TEXT id PK
        TEXT name "NOT NULL"
        TEXT description
        TEXT serial_number "UNIQUE"
        TEXT model
        TEXT manufacturer
        TEXT category
        TEXT status "NOT NULL, DEFAULT 'available'"
        TIMESTAMPTZ purchase_date
        INT purchase_value
        TIMESTAMPTZ warranty_expiry
        TEXT current_location_id FK
        TEXT created_by_id FK
        TIMESTAMPTZ created_at "DEFAULT now(), NOT NULL"
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ deleted_at
        TEXT deleted_by_id FK
    }

    EQUIPMENT_ALLOCATION {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT user_id FK "NOT NULL"
        TEXT location_id FK "NOT NULL"
        TEXT allocated_by_id FK "NOT NULL"
        TEXT authorized_by_id FK
        TEXT status "NOT NULL, DEFAULT 'active'"
        TIMESTAMPTZ allocated_at "DEFAULT now(), NOT NULL"
        TIMESTAMPTZ returned_at
        TIMESTAMPTZ expected_return_date
        TEXT notes
        TEXT created_by_id FK
        TIMESTAMPTZ created_at "DEFAULT now(), NOT NULL"
    }

    EQUIPMENT_MOVEMENT {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT from_location_id FK
        TEXT to_location_id FK "NOT NULL"
        TEXT moved_by_id FK "NOT NULL"
        TEXT authorized_by_id FK
        TEXT movement_type "NOT NULL"
        TEXT reason
        TIMESTAMPTZ movement_date "DEFAULT now(), NOT NULL"
        TEXT notes
        TEXT created_by_id FK
        TIMESTAMPTZ created_at "DEFAULT now(), NOT NULL"
    }

    EQUIPMENT_MAINTENANCE {
        TEXT id PK
        TEXT equipment_id FK "NOT NULL"
        TEXT maintenance_type "NOT NULL"
        TEXT description "NOT NULL"
        TEXT performed_by
        TEXT performed_by_id FK
        INT cost
        TIMESTAMPTZ start_date "NOT NULL"
        TIMESTAMPTZ end_date
        TEXT status "NOT NULL, DEFAULT 'scheduled'"
        TIMESTAMPTZ next_maintenance_date
        TEXT notes
        TEXT created_by_id FK
        TIMESTAMPTZ created_at "DEFAULT now(), NOT NULL"
        TIMESTAMPTZ updated_at
    }

    USER ||--o{ SESSION : "has sessions"
    USER ||--o{ REL_GROUP : "member of"
    USER ||--o{ AUDIT_LOG : "performed by"
    USER ||--o{ LOCATION : "created by"
    USER ||--o{ EQUIPMENT : "created by"
    USER ||--o{ EQUIPMENT_ALLOCATION : "allocated to"
    USER ||--o{ EQUIPMENT_ALLOCATION : "allocated by"
    USER ||--o{ EQUIPMENT_ALLOCATION : "authorized by"
    USER ||--o{ EQUIPMENT_MOVEMENT : "moved by"
    USER ||--o{ EQUIPMENT_MOVEMENT : "authorized by"
    USER ||--o{ EQUIPMENT_MAINTENANCE : "performed by"
    GROUP ||--o{ REL_GROUP : "has members"
    LOCATION ||--o{ EQUIPMENT : "contains"
    LOCATION ||--o{ EQUIPMENT_ALLOCATION : "destination"
    LOCATION ||--o{ EQUIPMENT_MOVEMENT : "from/to"
    EQUIPMENT ||--o{ EQUIPMENT_ALLOCATION : "has allocations"
    EQUIPMENT ||--o{ EQUIPMENT_MOVEMENT : "has movements"
    EQUIPMENT ||--o{ EQUIPMENT_MAINTENANCE : "has maintenance"
    EQUIPMENT }o--|| LOCATION : "currently at"
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
- location.description, address, building, floor, room are nullable
- location.is_active defaults to true
- location.created_by_id → user.id (foreign key, optional/nullable)
- location.created_at defaults to now() and is NOT NULL
- location.updated_at, deleted_at, deleted_by_id support soft delete pattern

**EQUIPMENT table:**

- equipment.id is the primary key (NOT NULL)
- equipment.name is NOT NULL
- equipment.serial_number is UNIQUE (nullable)
- equipment.status defaults to 'available' and is NOT NULL
- equipment.current_location_id → location.id (foreign key, optional/nullable)
- equipment.created_by_id → user.id (foreign key, optional/nullable)
- equipment.created_at defaults to now() and is NOT NULL
- equipment.purchase_value is stored in cents (integer)
- equipment.updated_at, deleted_at, deleted_by_id support soft delete pattern

**EQUIPMENT_ALLOCATION table:**

- equipment_allocation.id is the primary key (NOT NULL)
- equipment_allocation.equipment_id → equipment.id (foreign key, required/NOT NULL)
- equipment_allocation.user_id → user.id (foreign key, required/NOT NULL)
- equipment_allocation.location_id → location.id (foreign key, required/NOT NULL)
- equipment_allocation.allocated_by_id → user.id (foreign key, required/NOT NULL)
- equipment_allocation.authorized_by_id → user.id (foreign key, optional/nullable)
- equipment_allocation.status defaults to 'active' and is NOT NULL
- equipment_allocation.allocated_at defaults to now() and is NOT NULL
- equipment_allocation.returned_at, expected_return_date, notes are nullable

**EQUIPMENT_MOVEMENT table:**

- equipment_movement.id is the primary key (NOT NULL)
- equipment_movement.equipment_id → equipment.id (foreign key, required/NOT NULL)
- equipment_movement.from_location_id → location.id (foreign key, optional/nullable)
- equipment_movement.to_location_id → location.id (foreign key, required/NOT NULL)
- equipment_movement.moved_by_id → user.id (foreign key, required/NOT NULL)
- equipment_movement.authorized_by_id → user.id (foreign key, optional/nullable)
- equipment_movement.movement_type is NOT NULL (transfer, allocation, return, maintenance)
- equipment_movement.movement_date defaults to now() and is NOT NULL
- equipment_movement.reason, notes are nullable

**EQUIPMENT_MAINTENANCE table:**

- equipment_maintenance.id is the primary key (NOT NULL)
- equipment_maintenance.equipment_id → equipment.id (foreign key, required/NOT NULL)
- equipment_maintenance.maintenance_type is NOT NULL (preventive, corrective, calibration, upgrade)
- equipment_maintenance.description is NOT NULL
- equipment_maintenance.performed_by_id → user.id (foreign key, optional/nullable)
- equipment_maintenance.cost is stored in cents (integer, nullable)
- equipment_maintenance.start_date is NOT NULL
- equipment_maintenance.status defaults to 'scheduled' and is NOT NULL
- equipment_maintenance.end_date, next_maintenance_date, notes are nullable
- equipment_maintenance.created_at defaults to now() and is NOT NULL
