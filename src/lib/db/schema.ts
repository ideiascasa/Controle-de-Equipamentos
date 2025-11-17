import { pgTable, integer, text, timestamp, boolean, primaryKey, jsonb } from 'drizzle-orm/pg-core';

/*
> This document mirrors; Update this file whenever the TypeScript schema changes!

- src/lib/db/schema.ts (original)
- src/lib/db/schema.md (mirror)
- src/routes/doc/schema/+page.md (mirror)
 */

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
	name: text('name'),
	description: text('description')
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

export const auditLog = pgTable('audit_log', {
	id: text('id').primaryKey(),
	action: text('action').notNull(),
	performedById: text('performed_by_id').references(() => user.id),
	payload: jsonb('payload'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export const equipment = pgTable('equipment', {
	id: text('id').primaryKey(),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	category: text('category'),
	manufacturer: text('manufacturer'),
	model: text('model'),
	serialNumber: text('serial_number'),
	acquisitionDate: timestamp('acquisition_date', { withTimezone: true, mode: 'date' }),
	value: integer('value'),
	status: text('status').notNull().default('available'),
	currentLocation: text('current_location'),
	currentUserId: text('current_user_id').references(() => user.id),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	createdById: text('created_by_id').references(() => user.id),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
	updatedById: text('updated_by_id').references(() => user.id),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
	deletedById: text('deleted_by_id').references(() => user.id)
});

export const equipmentMovement = pgTable('equipment_movement', {
	id: text('id').primaryKey(),
	equipmentId: text('equipment_id').notNull().references(() => equipment.id),
	fromLocation: text('from_location'),
	toLocation: text('to_location').notNull(),
	fromUserId: text('from_user_id').references(() => user.id),
	toUserId: text('to_user_id').references(() => user.id),
	requestedById: text('requested_by_id').notNull().references(() => user.id),
	authorizedById: text('authorized_by_id').references(() => user.id),
	status: text('status').notNull().default('pending'),
	requestDate: timestamp('request_date', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	authorizationDate: timestamp('authorization_date', { withTimezone: true, mode: 'date' }),
	completionDate: timestamp('completion_date', { withTimezone: true, mode: 'date' }),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	createdById: text('created_by_id').references(() => user.id)
});

export const equipmentMaintenance = pgTable('equipment_maintenance', {
	id: text('id').primaryKey(),
	equipmentId: text('equipment_id').notNull().references(() => equipment.id),
	type: text('type').notNull(),
	description: text('description').notNull(),
	scheduledDate: timestamp('scheduled_date', { withTimezone: true, mode: 'date' }),
	completedDate: timestamp('completed_date', { withTimezone: true, mode: 'date' }),
	status: text('status').notNull().default('scheduled'),
	cost: integer('cost'),
	provider: text('provider'),
	technician: text('technician'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	createdById: text('created_by_id').references(() => user.id),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
	updatedById: text('updated_by_id').references(() => user.id)
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Group = typeof group.$inferSelect;

export type RelGroup = typeof relGroup.$inferSelect;

export type AuditLog = typeof auditLog.$inferSelect;

export type Equipment = typeof equipment.$inferSelect;

export type EquipmentMovement = typeof equipmentMovement.$inferSelect;

export type EquipmentMaintenance = typeof equipmentMaintenance.$inferSelect;
