import { pgTable, integer, text, timestamp, boolean, primaryKey, jsonb } from 'drizzle-orm/pg-core';

/*
> This document mirrors; Update this file whenever the TypeScript schema changes!

- src/lib/db/schema.ts (original)
- src/lib/db/schema.md (mirror)
- src/routes/doc/schema/+page.md (mirror)
 */

const PREFIX = "tesser_";

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

export const location = pgTable(PREFIX+'location', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	address: text('address'),
	building: text('building'),
	floor: text('floor'),
	room: text('room'),
	isActive: boolean('is_active').default(true),
	createdById: text('created_by_id').references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
	deletedById: text('deleted_by_id').references(() => user.id)
});

export const equipment = pgTable(PREFIX+'equipment', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	serialNumber: text('serial_number').unique(),
	model: text('model'),
	manufacturer: text('manufacturer'),
	category: text('category'),
	status: text('status').notNull().default('available'),
	purchaseDate: timestamp('purchase_date', { withTimezone: true, mode: 'date' }),
	purchaseValue: integer('purchase_value'),
	warrantyExpiry: timestamp('warranty_expiry', { withTimezone: true, mode: 'date' }),
	currentLocationId: text('current_location_id').references(() => location.id),
	createdById: text('created_by_id').references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
	deletedById: text('deleted_by_id').references(() => user.id)
});

export const equipmentAllocation = pgTable(PREFIX+'equipment_allocation', {
	id: text('id').primaryKey(),
	equipmentId: text('equipment_id').notNull().references(() => equipment.id),
	userId: text('user_id').notNull().references(() => user.id),
	locationId: text('location_id').notNull().references(() => location.id),
	allocatedById: text('allocated_by_id').notNull().references(() => user.id),
	authorizedById: text('authorized_by_id').references(() => user.id),
	status: text('status').notNull().default('active'),
	allocatedAt: timestamp('allocated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	returnedAt: timestamp('returned_at', { withTimezone: true, mode: 'date' }),
	expectedReturnDate: timestamp('expected_return_date', { withTimezone: true, mode: 'date' }),
	notes: text('notes'),
	createdById: text('created_by_id').references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export const equipmentMovement = pgTable(PREFIX+'equipment_movement', {
	id: text('id').primaryKey(),
	equipmentId: text('equipment_id').notNull().references(() => equipment.id),
	fromLocationId: text('from_location_id').references(() => location.id),
	toLocationId: text('to_location_id').notNull().references(() => location.id),
	movedById: text('moved_by_id').notNull().references(() => user.id),
	authorizedById: text('authorized_by_id').references(() => user.id),
	movementType: text('movement_type').notNull(),
	reason: text('reason'),
	movementDate: timestamp('movement_date', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	notes: text('notes'),
	createdById: text('created_by_id').references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export const equipmentMaintenance = pgTable(PREFIX+'equipment_maintenance', {
	id: text('id').primaryKey(),
	equipmentId: text('equipment_id').notNull().references(() => equipment.id),
	maintenanceType: text('maintenance_type').notNull(),
	description: text('description').notNull(),
	performedBy: text('performed_by'),
	performedById: text('performed_by_id').references(() => user.id),
	cost: integer('cost'),
	startDate: timestamp('start_date', { withTimezone: true, mode: 'date' }).notNull(),
	endDate: timestamp('end_date', { withTimezone: true, mode: 'date' }),
	status: text('status').notNull().default('scheduled'),
	nextMaintenanceDate: timestamp('next_maintenance_date', { withTimezone: true, mode: 'date' }),
	notes: text('notes'),
	createdById: text('created_by_id').references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Group = typeof group.$inferSelect;

export type RelGroup = typeof relGroup.$inferSelect;

export type AuditLog = typeof auditLog.$inferSelect;

export type Location = typeof location.$inferSelect;

export type Equipment = typeof equipment.$inferSelect;

export type EquipmentAllocation = typeof equipmentAllocation.$inferSelect;

export type EquipmentMovement = typeof equipmentMovement.$inferSelect;

export type EquipmentMaintenance = typeof equipmentMaintenance.$inferSelect;
