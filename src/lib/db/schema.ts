import {
	pgTable,
	integer,
	text,
	timestamp,
	boolean,
	primaryKey,
	pgEnum,
	uuid,
	jsonb,
	foreignKey
} from 'drizzle-orm/pg-core';

/*
> This document mirrors; Update this file whenever the TypeScript schema changes!
- src/lib/db/schema.ts.
- src/routes/doc/schema/+page.md
 */

export const equipmentStatusEnum = pgEnum('equipment_status', ['ativo', 'em_manutencao', 'inativo']);

export const equipmentCriticalityEnum = pgEnum('equipment_criticality', ['baixa', 'media', 'alta']);

export const equipmentMaintenanceTypeEnum = pgEnum('equipment_maintenance_type', [
	'preventiva',
	'corretiva',
	'calibracao'
]);

export const equipmentMovementStatusEnum = pgEnum('equipment_movement_status', [
	'pendente',
	'aprovado',
	'rejeitado',
	'completado',
	'cancelado'
]);

export const equipmentAuditEventEnum = pgEnum('equipment_audit_event', [
	'cadastro',
	'edicao',
	'movimento',
	'manutencao',
	'status_change'
]);

export const locationTypeEnum = pgEnum('location_type', ['matriz', 'filial', 'sala', 'outro']);

export const movementPolicyScopeEnum = pgEnum('movement_policy_scope', ['role', 'location', 'category']);

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	name: text('name'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash')
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const group = pgTable('group', {
	id: text('id').primaryKey().unique(),
	name: text('name')
});

export const relGroup = pgTable(
	'rel_group',
	{
		groupId: text('group_id')
			.notNull()
			.references(() => group.id),
		userId: text('user_id')
			.notNull()
			.references(() => user.id),
		adm: boolean('adm').default(false)
	},
	(table) => ({
		pk: primaryKey({ columns: [table.groupId, table.userId] })
	})
);

export const location = pgTable(
	'location',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: text('name').notNull(),
		parentId: uuid('parent_id'),
		type: locationTypeEnum('type').notNull().default('sala'),
		timezone: text('timezone'),
		isActive: boolean('is_active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
	},
	(table) => ({
		parentReference: foreignKey({
			name: 'location_parent_id_fkey',
			columns: [table.parentId],
			foreignColumns: [table.id]
		}).onDelete('set null')
	})
);

export const equipment = pgTable('equipment', {
	id: uuid('id').defaultRandom().primaryKey(),
	assetCode: text('asset_code').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	category: text('category'),
	criticality: equipmentCriticalityEnum('criticality').notNull().default('media'),
	status: equipmentStatusEnum('status').notNull().default('ativo'),
	locationId: uuid('location_id').references(() => location.id),
	custodianUserId: text('custodian_user_id').references(() => user.id),
	acquisitionDate: timestamp('acquisition_date', { mode: 'string' }),
	depreciationEnd: timestamp('depreciation_end', { mode: 'string' }),
	metadata: jsonb('metadata'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
});

export const equipmentMovement = pgTable('equipment_movement', {
	id: uuid('id').defaultRandom().primaryKey(),
	equipmentId: uuid('equipment_id')
		.notNull()
		.references(() => equipment.id),
	requestedByUserId: text('requested_by_user_id')
		.notNull()
		.references(() => user.id),
	authorizedByUserId: text('authorized_by_user_id').references(() => user.id),
	originLocationId: uuid('origin_location_id').references(() => location.id),
	targetLocationId: uuid('target_location_id')
		.notNull()
		.references(() => location.id),
	status: equipmentMovementStatusEnum('status').notNull().default('pendente'),
	authorizationNote: text('authorization_note'),
	movementNote: text('movement_note'),
	requestedAt: timestamp('requested_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	authorizedAt: timestamp('authorized_at', { withTimezone: true, mode: 'string' }),
	executedAt: timestamp('executed_at', { withTimezone: true, mode: 'string' }),
	payload: jsonb('payload'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
});

export const equipmentMaintenance = pgTable('equipment_maintenance', {
	id: uuid('id').defaultRandom().primaryKey(),
	equipmentId: uuid('equipment_id')
		.notNull()
		.references(() => equipment.id),
	type: equipmentMaintenanceTypeEnum('type').notNull(),
	scheduledFor: timestamp('scheduled_for', { withTimezone: true, mode: 'string' }),
	startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
	completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
	technicianUserId: text('technician_user_id').references(() => user.id),
	resultNote: text('result_note'),
	status: equipmentStatusEnum('status').notNull().default('em_manutencao'),
	attachments: jsonb('attachments'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
});

export const equipmentAuditLog = pgTable('equipment_audit_log', {
	id: uuid('id').defaultRandom().primaryKey(),
	equipmentId: uuid('equipment_id')
		.notNull()
		.references(() => equipment.id),
	eventType: equipmentAuditEventEnum('event_type').notNull(),
	payload: jsonb('payload'),
	actorUserId: text('actor_user_id').references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
});

export const movementPolicy = pgTable('movement_policy', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	scope: movementPolicyScopeEnum('scope').notNull(),
	role: text('role'),
	locationId: uuid('location_id').references(() => location.id),
	category: text('category'),
	requiresApproval: boolean('requires_approval').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Group = typeof group.$inferSelect;

export type RelGroup = typeof relGroup.$inferSelect;

export type Location = typeof location.$inferSelect;

export type Equipment = typeof equipment.$inferSelect;

export type EquipmentMovement = typeof equipmentMovement.$inferSelect;

export type EquipmentMaintenance = typeof equipmentMaintenance.$inferSelect;

export type EquipmentAuditLog = typeof equipmentAuditLog.$inferSelect;

export type MovementPolicy = typeof movementPolicy.$inferSelect;
