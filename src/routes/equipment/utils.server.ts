import { eq, and, isNull, desc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '$lib/db/schema';
import { generateUniqueId } from '$lib/utils/common';
import { createAuditLog } from '$lib/utils/audit';

export interface EquipmentData {
	name: string;
	description?: string | null;
	serialNumber?: string | null;
	category?: string | null;
	status?: string | null;
	currentLocationId?: string | null;
	currentUserId?: string | null;
}

export interface MovementData {
	equipmentId: string;
	toLocationId: string;
	fromLocationId?: string | null;
	toUserId?: string | null;
	fromUserId?: string | null;
	authorizedById?: string | null;
	reason?: string | null;
}

export interface MaintenanceData {
	equipmentId: string;
	maintenanceType: string;
	description: string;
	cost?: number | null;
	performedById?: string | null;
	authorizedById?: string | null;
	startDate?: Date | null;
	endDate?: Date | null;
	status?: string | null;
}

export async function createEquipment(
	db: PostgresJsDatabase<typeof schema>,
	data: EquipmentData,
	userId: string
): Promise<{ success: boolean; error?: string; equipment?: schema.Equipment }> {
	// Validate name
	if (!data.name || data.name.trim().length === 0) {
		return { success: false, error: 'EQUIPMENT_NAME_REQUIRED' };
	}

	if (data.name.length > 255) {
		return { success: false, error: 'EQUIPMENT_NAME_TOO_LONG' };
	}

	// Check serial number uniqueness if provided
	if (data.serialNumber) {
		const existing = await db
			.select()
			.from(schema.equipment)
			.where(eq(schema.equipment.serialNumber, data.serialNumber))
			.limit(1);

		if (existing.length > 0) {
			return { success: false, error: 'SERIAL_NUMBER_EXISTS' };
		}
	}

	const equipmentId = generateUniqueId();

	try {
		const [equipment] = await db
			.insert(schema.equipment)
			.values({
				id: equipmentId,
				name: data.name.trim(),
				description: data.description?.trim() || null,
				serialNumber: data.serialNumber?.trim() || null,
				category: data.category?.trim() || null,
				status: data.status || 'available',
				currentLocationId: data.currentLocationId || null,
				currentUserId: data.currentUserId || null,
				createdById: userId
			})
			.returning();

		await createAuditLog(db, 'equipment.create', userId, {
			equipmentId,
			name: data.name,
			serialNumber: data.serialNumber
		});

		return { success: true, equipment };
	} catch (error) {
		return { success: false, error: 'EQUIPMENT_CREATE_FAILED' };
	}
}

export async function getEquipmentById(
	db: PostgresJsDatabase<typeof schema>,
	equipmentId: string
): Promise<schema.Equipment | null> {
	const [equipment] = await db
		.select()
		.from(schema.equipment)
		.where(and(eq(schema.equipment.id, equipmentId), isNull(schema.equipment.deletedAt)))
		.limit(1);

	return equipment || null;
}

export async function getEquipmentList(
	db: PostgresJsDatabase<typeof schema>
): Promise<schema.Equipment[]> {
	return await db
		.select()
		.from(schema.equipment)
		.where(isNull(schema.equipment.deletedAt))
		.orderBy(desc(schema.equipment.createdAt));
}

export async function createMovement(
	db: PostgresJsDatabase<typeof schema>,
	data: MovementData,
	userId: string
): Promise<{ success: boolean; error?: string; movement?: schema.EquipmentMovement }> {
	// Validate equipment exists
	const equipment = await getEquipmentById(db, data.equipmentId);
	if (!equipment) {
		return { success: false, error: 'EQUIPMENT_NOT_FOUND' };
	}

	// Validate destination location
	if (!data.toLocationId) {
		return { success: false, error: 'DESTINATION_LOCATION_REQUIRED' };
	}

	const movementId = generateUniqueId();

	try {
		const [movement] = await db
			.insert(schema.equipmentMovement)
			.values({
				id: movementId,
				equipmentId: data.equipmentId,
				fromLocationId: data.fromLocationId || equipment.currentLocationId || null,
				toLocationId: data.toLocationId,
				fromUserId: data.fromUserId || equipment.currentUserId || null,
				toUserId: data.toUserId || null,
				movedById: userId,
				authorizedById: data.authorizedById || null,
				reason: data.reason?.trim() || null,
				status: 'pending'
			})
			.returning();

		// If authorized or no authorization required, complete immediately
		if (data.authorizedById || !data.authorizedById) {
			await completeMovement(db, movementId, userId);
		}

		await createAuditLog(db, 'equipment.move', userId, {
			movementId,
			equipmentId: data.equipmentId,
			toLocationId: data.toLocationId
		});

		return { success: true, movement };
	} catch (error) {
		return { success: false, error: 'MOVEMENT_CREATE_FAILED' };
	}
}

export async function completeMovement(
	db: PostgresJsDatabase<typeof schema>,
	movementId: string,
	userId: string
): Promise<{ success: boolean; error?: string }> {
	const [movement] = await db
		.select()
		.from(schema.equipmentMovement)
		.where(eq(schema.equipmentMovement.id, movementId))
		.limit(1);

	if (!movement) {
		return { success: false, error: 'MOVEMENT_NOT_FOUND' };
	}

	if (movement.status === 'completed') {
		return { success: false, error: 'MOVEMENT_ALREADY_COMPLETED' };
	}

	await db.transaction(async (tx) => {
		// Update equipment location and user
		await tx
			.update(schema.equipment)
			.set({
				currentLocationId: movement.toLocationId,
				currentUserId: movement.toUserId,
				updatedAt: new Date()
			})
			.where(eq(schema.equipment.id, movement.equipmentId));

		// Mark movement as completed
		await tx
			.update(schema.equipmentMovement)
			.set({
				status: 'completed',
				completedAt: new Date()
			})
			.where(eq(schema.equipmentMovement.id, movementId));
	});

	return { success: true };
}

export async function createMaintenance(
	db: PostgresJsDatabase<typeof schema>,
	data: MaintenanceData,
	userId: string
): Promise<{ success: boolean; error?: string; maintenance?: schema.EquipmentMaintenance }> {
	// Validate equipment exists
	const equipment = await getEquipmentById(db, data.equipmentId);
	if (!equipment) {
		return { success: false, error: 'EQUIPMENT_NOT_FOUND' };
	}

	// Validate required fields
	if (!data.maintenanceType || data.maintenanceType.trim().length === 0) {
		return { success: false, error: 'MAINTENANCE_TYPE_REQUIRED' };
	}

	if (!data.description || data.description.trim().length === 0) {
		return { success: false, error: 'MAINTENANCE_DESCRIPTION_REQUIRED' };
	}

	const maintenanceId = generateUniqueId();

	try {
		const [maintenance] = await db
			.insert(schema.equipmentMaintenance)
			.values({
				id: maintenanceId,
				equipmentId: data.equipmentId,
				maintenanceType: data.maintenanceType.trim(),
				description: data.description.trim(),
				cost: data.cost || null,
				performedById: data.performedById || null,
				authorizedById: data.authorizedById || null,
				startDate: data.startDate || null,
				endDate: data.endDate || null,
				status: data.status || 'scheduled',
				createdById: userId
			})
			.returning();

		// Update equipment status if maintenance is in progress
		if (data.status === 'in_progress') {
			await db
				.update(schema.equipment)
				.set({
					status: 'maintenance',
					updatedAt: new Date()
				})
				.where(eq(schema.equipment.id, data.equipmentId));
		}

		await createAuditLog(db, 'equipment.maintenance.create', userId, {
			maintenanceId,
			equipmentId: data.equipmentId,
			maintenanceType: data.maintenanceType
		});

		return { success: true, maintenance };
	} catch (error) {
		return { success: false, error: 'MAINTENANCE_CREATE_FAILED' };
	}
}

export async function getMovementHistory(
	db: PostgresJsDatabase<typeof schema>,
	equipmentId: string,
	limit: number = 10
): Promise<schema.EquipmentMovement[]> {
	return await db
		.select()
		.from(schema.equipmentMovement)
		.where(eq(schema.equipmentMovement.equipmentId, equipmentId))
		.orderBy(desc(schema.equipmentMovement.createdAt))
		.limit(limit);
}

export async function getMaintenanceHistory(
	db: PostgresJsDatabase<typeof schema>,
	equipmentId: string,
	limit: number = 10
): Promise<schema.EquipmentMaintenance[]> {
	return await db
		.select()
		.from(schema.equipmentMaintenance)
		.where(eq(schema.equipmentMaintenance.equipmentId, equipmentId))
		.orderBy(desc(schema.equipmentMaintenance.createdAt))
		.limit(limit);
}

export async function getAllLocations(
	db: PostgresJsDatabase<typeof schema>
): Promise<schema.Location[]> {
	return await db
		.select()
		.from(schema.location)
		.where(isNull(schema.location.deletedAt))
		.orderBy(schema.location.name);
}

export async function getAllUsers(
	db: PostgresJsDatabase<typeof schema>
): Promise<Array<{ id: string; username: string; name: string | null }>> {
	return await db
		.select({
			id: schema.user.id,
			username: schema.user.username,
			name: schema.user.name
		})
		.from(schema.user);
}
