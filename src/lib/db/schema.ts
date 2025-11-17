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

export const location = pgTable('location', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	address: text('address'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	createdById: text('created_by_id').references(() => user.id),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
	deletedById: text('deleted_by_id').references(() => user.id)
});

export const equipment = pgTable('equipment', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	serialNumber: text('serial_number').unique(),
	category: text('category'),
	status: text('status').notNull().default('available'),
	currentLocationId: text('current_location_id').references(() => location.id),
	currentUserId: text('current_user_id').references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	createdById: text('created_by_id').references(() => user.id),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
	deletedById: text('deleted_by_id').references(() => user.id)
});

export const equipmentMovement = pgTable('equipment_movement', {
	id: text('id').primaryKey(),
	equipmentId: text('equipment_id').notNull().references(() => equipment.id),
	fromLocationId: text('from_location_id').references(() => location.id),
	toLocationId: text('to_location_id').notNull().references(() => location.id),
	fromUserId: text('from_user_id').references(() => user.id),
	toUserId: text('to_user_id').references(() => user.id),
	movedById: text('moved_by_id').notNull().references(() => user.id),
	authorizedById: text('authorized_by_id').references(() => user.id),
	reason: text('reason'),
	status: text('status').notNull().default('pending'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' })
});

export const equipmentMaintenance = pgTable('equipment_maintenance', {
	id: text('id').primaryKey(),
	equipmentId: text('equipment_id').notNull().references(() => equipment.id),
	maintenanceType: text('maintenance_type').notNull(),
	description: text('description').notNull(),
	cost: integer('cost'),
	performedById: text('performed_by_id').references(() => user.id),
	authorizedById: text('authorized_by_id').references(() => user.id),
	startDate: timestamp('start_date', { withTimezone: true, mode: 'date' }),
	endDate: timestamp('end_date', { withTimezone: true, mode: 'date' }),
	status: text('status').notNull().default('scheduled'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	createdById: text('created_by_id').notNull().references(() => user.id)
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Group = typeof group.$inferSelect;

export type RelGroup = typeof relGroup.$inferSelect;

export type AuditLog = typeof auditLog.$inferSelect;

export type Location = typeof location.$inferSelect;

export type Equipment = typeof equipment.$inferSelect;

export type EquipmentMovement = typeof equipmentMovement.$inferSelect;

export type EquipmentMaintenance = typeof equipmentMaintenance.$inferSelect;
