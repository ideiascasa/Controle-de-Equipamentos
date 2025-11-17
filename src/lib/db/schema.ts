import { pgTable, integer, text, timestamp, boolean, primaryKey, jsonb } from 'drizzle-orm/pg-core';

/*
> This document mirrors; Update this file whenever the TypeScript schema changes!

- src/lib/db/schema.ts (original)
- src/lib/db/schema.md (mirror)
- src/routes/doc/schema/+page.md (mirror)
 */

const PREFIX = "tesser-";

export const user = pgTable(PREFIX+'user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	name: text('name'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash')
});

export const session = pgTable(PREFIX+'sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const group = pgTable(PREFIX+'group', {
	id: text('id').primaryKey().unique(),
	name: text('name'),
	description: text('description')
});

export const relGroup = pgTable(
	PREFIX+'rel_group',
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

export const auditLog = pgTable(PREFIX+'audit_log', {
	id: text('id').primaryKey(),
	action: text('action').notNull(),
	performedById: text('performed_by_id').references(() => user.id),
	payload: jsonb('payload'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Group = typeof group.$inferSelect;

export type RelGroup = typeof relGroup.$inferSelect;

export type AuditLog = typeof auditLog.$inferSelect;

export const location = pgTable(PREFIX+'location', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	address: text('address'),
	building: text('building'),
	floor: text('floor'),
	room: text('room'),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	createdById: text('created_by_id').references(() => user.id),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
	updatedById: text('updated_by_id').references(() => user.id)
});

export const equipment = pgTable(PREFIX+'equipment', {
	id: text('id').primaryKey(),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	category: text('category'),
	brand: text('brand'),
	model: text('model'),
	serialNumber: text('serial_number'),
	patrimonyNumber: text('patrimony_number'),
	purchaseDate: timestamp('purchase_date', { withTimezone: true, mode: 'date' }),
	purchaseValue: text('purchase_value'),
	supplier: text('supplier'),
	warrantyExpiry: timestamp('warranty_expiry', { withTimezone: true, mode: 'date' }),
	status: text('status').notNull().default('available'),
	currentLocationId: text('current_location_id').references(() => location.id),
	currentUserId: text('current_user_id').references(() => user.id),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	createdById: text('created_by_id').references(() => user.id),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
	updatedById: text('updated_by_id').references(() => user.id),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
	deletedById: text('deleted_by_id').references(() => user.id)
});

export const equipmentMovement = pgTable(PREFIX+'equipment_movement', {
	id: text('id').primaryKey(),
	equipmentId: text('equipment_id').notNull().references(() => equipment.id),
	fromLocationId: text('from_location_id').references(() => location.id),
	toLocationId: text('to_location_id').notNull().references(() => location.id),
	fromUserId: text('from_user_id').references(() => user.id),
	toUserId: text('to_user_id').references(() => user.id),
	requestedById: text('requested_by_id').notNull().references(() => user.id),
	authorizedById: text('authorized_by_id').references(() => user.id),
	status: text('status').notNull().default('pending'),
	reason: text('reason'),
	requestedAt: timestamp('requested_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	authorizedAt: timestamp('authorized_at', { withTimezone: true, mode: 'date' }),
	completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export const equipmentMaintenance = pgTable(PREFIX+'equipment_maintenance', {
	id: text('id').primaryKey(),
	equipmentId: text('equipment_id').notNull().references(() => equipment.id),
	type: text('type').notNull(),
	description: text('description').notNull(),
	cost: text('cost'),
	supplier: text('supplier'),
	startDate: timestamp('start_date', { withTimezone: true, mode: 'date' }).notNull(),
	endDate: timestamp('end_date', { withTimezone: true, mode: 'date' }),
	nextMaintenanceDate: timestamp('next_maintenance_date', { withTimezone: true, mode: 'date' }),
	status: text('status').notNull().default('scheduled'),
	performedById: text('performed_by_id').references(() => user.id),
	registeredById: text('registered_by_id').notNull().references(() => user.id),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export type Location = typeof location.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type EquipmentMovement = typeof equipmentMovement.$inferSelect;
export type EquipmentMaintenance = typeof equipmentMaintenance.$inferSelect;
