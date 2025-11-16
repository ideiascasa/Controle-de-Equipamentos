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
	description: text('description'),
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
		adm: boolean('adm').default(false),
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
	name: text('name').notNull(),
	description: text('description'),
	serialNumber: text('serial_number').unique(),
	category: text('category'),
	status: text('status').notNull().default('available'), // available, allocated, maintenance, pending_movement, retired
	currentLocation: text('current_location'),
	currentUserId: text('current_user_id').references(() => user.id),
	groupId: text('group_id').references(() => group.id),
	imageUrl: text('image_url'),
	metadata: jsonb('metadata'),
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
	status: text('status').notNull().default('pending'), // pending, approved, rejected, completed, cancelled
	requestedById: text('requested_by_id').notNull().references(() => user.id),
	approvedById: text('approved_by_id').references(() => user.id),
	approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }),
	completedById: text('completed_by_id').references(() => user.id),
	completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
});

export const equipmentLocationHistory = pgTable('equipment_location_history', {
	id: text('id').primaryKey(),
	equipmentId: text('equipment_id').notNull().references(() => equipment.id),
	movementId: text('movement_id').references(() => equipmentMovement.id),
	location: text('location').notNull(),
	userId: text('user_id').references(() => user.id),
	action: text('action').notNull(), // allocated, returned, moved, created, etc.
	performedById: text('performed_by_id').notNull().references(() => user.id),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export const equipmentMaintenance = pgTable('equipment_maintenance', {
	id: text('id').primaryKey(),
	equipmentId: text('equipment_id').notNull().references(() => equipment.id),
	maintenanceType: text('maintenance_type').notNull(), // preventive, corrective, inspection
	description: text('description'),
	scheduledDate: timestamp('scheduled_date', { withTimezone: true, mode: 'date' }),
	completedDate: timestamp('completed_date', { withTimezone: true, mode: 'date' }),
	status: text('status').notNull().default('scheduled'), // scheduled, in_progress, completed, cancelled
	assignedToId: text('assigned_to_id').references(() => user.id),
	createdById: text('created_by_id').notNull().references(() => user.id),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Group = typeof group.$inferSelect;

export type RelGroup = typeof relGroup.$inferSelect;

export type AuditLog = typeof auditLog.$inferSelect;

export type Equipment = typeof equipment.$inferSelect;

export type EquipmentMovement = typeof equipmentMovement.$inferSelect;

export type EquipmentLocationHistory = typeof equipmentLocationHistory.$inferSelect;

export type EquipmentMaintenance = typeof equipmentMaintenance.$inferSelect;
