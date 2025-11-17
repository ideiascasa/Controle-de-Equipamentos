import { eq, and, isNull, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '$lib/db/schema';
import { generateUniqueId } from '$lib/utils/common';
import { createAuditLog } from '$lib/utils/audit';

export async function createEquipment(
	db: PostgresJsDatabase<typeof schema>,
	fields: Record<string, FormDataEntryValue | null>,
	actorId: string
): Promise<{ success: boolean; error?: string; equipment?: schema.Equipment }> {
	const code = fields.code?.toString().trim();
	const name = fields.name?.toString().trim();

	if (!code || code.length === 0) {
		return { success: false, error: 'CODE_REQUIRED' };
	}

	if (!name || name.length === 0) {
		return { success: false, error: 'NAME_REQUIRED' };
	}

	// Check if code already exists
	const existing = await db
		.select()
		.from(schema.equipment)
		.where(and(eq(schema.equipment.code, code), isNull(schema.equipment.deletedAt)))
		.limit(1);

	if (existing.length > 0) {
		return { success: false, error: 'CODE_ALREADY_EXISTS' };
	}

	const equipmentId = generateUniqueId();
	const now = new Date();

	try {
		const [inserted] = await db
			.insert(schema.equipment)
			.values({
				id: equipmentId,
				code,
				name,
				description: fields.description?.toString() || null,
				category: fields.category?.toString() || null,
				brand: fields.brand?.toString() || null,
				model: fields.model?.toString() || null,
				serialNumber: fields.serialNumber?.toString() || null,
				status: (fields.status?.toString() as 'available' | 'in_use' | 'maintenance' | 'unavailable') || 'available',
				currentLocationId: fields.currentLocationId?.toString() || null,
				currentUserId: fields.currentUserId?.toString() || null,
				purchaseDate: fields.purchaseDate ? new Date(fields.purchaseDate.toString()) : null,
				purchaseValue: fields.purchaseValue ? parseInt(fields.purchaseValue.toString()) : null,
				warrantyExpiry: fields.warrantyExpiry ? new Date(fields.warrantyExpiry.toString()) : null,
				createdById: actorId,
				createdAt: now
			})
			.returning();

		await createAuditLog(db, 'equipment.create', actorId, {
			equipmentId,
			code,
			name
		});

		return { success: true, equipment: inserted };
	} catch (error) {
		return { success: false, error: 'EQUIPMENT_CREATE_FAILED' };
	}
}

export async function getEquipmentWithDetails(
	db: PostgresJsDatabase<typeof schema>,
	equipmentId: string
) {
	const [equipment] = await db
		.select({
			equipment: schema.equipment,
			location: {
				id: schema.location.id,
				name: schema.location.name,
				description: schema.location.description
			},
			user: {
				id: schema.user.id,
				username: schema.user.username,
				name: schema.user.name
			}
		})
		.from(schema.equipment)
		.leftJoin(schema.location, eq(schema.equipment.currentLocationId, schema.location.id))
		.leftJoin(schema.user, eq(schema.equipment.currentUserId, schema.user.id))
		.where(and(eq(schema.equipment.id, equipmentId), isNull(schema.equipment.deletedAt)))
		.limit(1);

	return equipment;
}

export async function getEquipmentList(
	db: PostgresJsDatabase<typeof schema>
): Promise<
	Array<{
		equipment: schema.Equipment;
		location: { id: string; name: string | null } | null;
		user: { id: string; username: string; name: string | null } | null;
	}>
> {
	const results = await db
		.select({
			equipment: schema.equipment,
			location: {
				id: schema.location.id,
				name: schema.location.name
			},
			user: {
				id: schema.user.id,
				username: schema.user.username,
				name: schema.user.name
			}
		})
		.from(schema.equipment)
		.leftJoin(schema.location, eq(schema.equipment.currentLocationId, schema.location.id))
		.leftJoin(schema.user, eq(schema.equipment.currentUserId, schema.user.id))
		.where(isNull(schema.equipment.deletedAt))
		.orderBy(schema.equipment.createdAt);

	return results;
}

export async function getLocations(
	db: PostgresJsDatabase<typeof schema>
): Promise<schema.Location[]> {
	return await db
		.select()
		.from(schema.location)
		.where(and(eq(schema.location.isActive, true), isNull(schema.location.deletedAt)))
		.orderBy(schema.location.name);
}

export async function getUsers(
	db: PostgresJsDatabase<typeof schema>
): Promise<{ id: string; username: string; name: string | null }[]> {
	return await db
		.select({
			id: schema.user.id,
			username: schema.user.username,
			name: schema.user.name
		})
		.from(schema.user)
		.orderBy(schema.user.username);
}
