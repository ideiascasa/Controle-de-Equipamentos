import { eq, and, isNull, desc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '$lib/db/schema';
import { generateUniqueId } from '$lib/utils/common';
import { createAuditLog } from '$lib/utils/audit';

export async function createEquipment(
	db: PostgresJsDatabase<typeof schema>,
	data: {
		name: string;
		description?: string | null;
		serialNumber?: string | null;
		model?: string | null;
		manufacturer?: string | null;
		category?: string | null;
		status?: string;
		purchaseDate?: Date | null;
		purchaseValue?: number | null;
		currentLocationId?: string | null;
		currentUserId?: string | null;
	},
	userId: string
): Promise<{ success: boolean; error?: string; equipment?: schema.Equipment }> {
	try {
		// Validate name
		if (!data.name || data.name.trim().length === 0) {
			return { success: false, error: 'NAME_REQUIRED' };
		}

		// Check if serial number already exists (if provided)
		if (data.serialNumber) {
			const existing = await db
				.select()
				.from(schema.equipment)
				.where(eq(schema.equipment.serialNumber, data.serialNumber))
				.limit(1);

			if (existing.length > 0) {
				return { success: false, error: 'SERIAL_ALREADY_EXISTS' };
			}
		}

		const equipmentId = generateUniqueId();

		const [equipment] = await db
			.insert(schema.equipment)
			.values({
				id: equipmentId,
				name: data.name.trim(),
				description: data.description?.trim() || null,
				serialNumber: data.serialNumber?.trim() || null,
				model: data.model?.trim() || null,
				manufacturer: data.manufacturer?.trim() || null,
				category: data.category?.trim() || null,
				status: data.status || 'available',
				purchaseDate: data.purchaseDate || null,
				purchaseValue: data.purchaseValue || null,
				currentLocationId: data.currentLocationId || null,
				currentUserId: data.currentUserId || null,
				createdById: userId
			})
			.returning();

		await createAuditLog(db, 'equipment.created', userId, {
			equipmentId,
			name: data.name
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

export async function listEquipment(
	db: PostgresJsDatabase<typeof schema>,
	filters?: {
		status?: string;
		category?: string;
		locationId?: string;
		userId?: string;
	}
): Promise<schema.Equipment[]> {
	const conditions = [isNull(schema.equipment.deletedAt)];

	if (filters?.status) {
		conditions.push(eq(schema.equipment.status, filters.status));
	}

	if (filters?.category) {
		conditions.push(eq(schema.equipment.category, filters.category));
	}

	if (filters?.locationId) {
		conditions.push(eq(schema.equipment.currentLocationId, filters.locationId));
	}

	if (filters?.userId) {
		conditions.push(eq(schema.equipment.currentUserId, filters.userId));
	}

	return await db
		.select()
		.from(schema.equipment)
		.where(and(...conditions))
		.orderBy(desc(schema.equipment.createdAt));
}

export async function createMovement(
	db: PostgresJsDatabase<typeof schema>,
	data: {
		equipmentId: string;
		toLocationId?: string | null;
		toUserId?: string | null;
		reason?: string | null;
	},
	userId: string
): Promise<{ success: boolean; error?: string; movement?: schema.EquipmentMovement }> {
	try {
		const equipment = await getEquipmentById(db, data.equipmentId);
		if (!equipment) {
			return { success: false, error: 'EQUIPMENT_NOT_FOUND' };
		}

		const movementId = generateUniqueId();

		const [movement] = await db
			.insert(schema.equipmentMovement)
			.values({
				id: movementId,
				equipmentId: data.equipmentId,
				fromLocationId: equipment.currentLocationId,
				fromUserId: equipment.currentUserId,
				toLocationId: data.toLocationId || null,
				toUserId: data.toUserId || null,
				reason: data.reason?.trim() || null,
				status: 'pending',
				requestedById: userId
			})
			.returning();

		await createAuditLog(db, 'equipment.movement.requested', userId, {
			movementId,
			equipmentId: data.equipmentId,
			toLocationId: data.toLocationId,
			toUserId: data.toUserId
		});

		// Auto-approve and complete if no authorization required
		// For now, we'll require authorization for all movements
		// This can be configured later based on business rules

		return { success: true, movement };
	} catch (error) {
		return { success: false, error: 'MOVEMENT_CREATE_FAILED' };
	}
}

export async function approveMovement(
	db: PostgresJsDatabase<typeof schema>,
	movementId: string,
	userId: string
): Promise<{ success: boolean; error?: string }> {
	return db.transaction(async (tx) => {
		const [movement] = await tx
			.select()
			.from(schema.equipmentMovement)
			.where(eq(schema.equipmentMovement.id, movementId))
			.limit(1);

		if (!movement) {
			return { success: false, error: 'MOVEMENT_NOT_FOUND' };
		}

		if (movement.status !== 'pending') {
			return { success: false, error: 'MOVEMENT_NOT_PENDING' };
		}

		// Update movement status
		await tx
			.update(schema.equipmentMovement)
			.set({
				status: 'approved',
				authorizedById: userId,
				authorizedAt: new Date()
			})
			.where(eq(schema.equipmentMovement.id, movementId));

		// Update equipment location/user
		await tx
			.update(schema.equipment)
			.set({
				currentLocationId: movement.toLocationId,
				currentUserId: movement.toUserId,
				updatedById: userId,
				updatedAt: new Date()
			})
			.where(eq(schema.equipment.id, movement.equipmentId));

		// Complete the movement
		await tx
			.update(schema.equipmentMovement)
			.set({
				status: 'completed',
				completedById: userId,
				completedAt: new Date()
			})
			.where(eq(schema.equipmentMovement.id, movementId));

		await createAuditLog(tx, 'equipment.movement.approved', userId, {
			movementId,
			equipmentId: movement.equipmentId
		});

		await createAuditLog(tx, 'equipment.movement.completed', userId, {
			movementId,
			equipmentId: movement.equipmentId
		});

		return { success: true };
	});
}

export async function rejectMovement(
	db: PostgresJsDatabase<typeof schema>,
	movementId: string,
	userId: string,
	reason?: string
): Promise<{ success: boolean; error?: string }> {
	const [movement] = await db
		.select()
		.from(schema.equipmentMovement)
		.where(eq(schema.equipmentMovement.id, movementId))
		.limit(1);

	if (!movement) {
		return { success: false, error: 'MOVEMENT_NOT_FOUND' };
	}

	if (movement.status !== 'pending') {
		return { success: false, error: 'MOVEMENT_NOT_PENDING' };
	}

	await db
		.update(schema.equipmentMovement)
		.set({
			status: 'rejected',
			authorizedById: userId,
			authorizedAt: new Date(),
			reason: reason || movement.reason
		})
		.where(eq(schema.equipmentMovement.id, movementId));

	await createAuditLog(db, 'equipment.movement.rejected', userId, {
		movementId,
		equipmentId: movement.equipmentId,
		reason
	});

	return { success: true };
}

export async function getMovementHistory(
	db: PostgresJsDatabase<typeof schema>,
	equipmentId: string
): Promise<schema.EquipmentMovement[]> {
	return await db
		.select()
		.from(schema.equipmentMovement)
		.where(eq(schema.equipmentMovement.equipmentId, equipmentId))
		.orderBy(desc(schema.equipmentMovement.createdAt));
}

export async function createMaintenance(
	db: PostgresJsDatabase<typeof schema>,
	data: {
		equipmentId: string;
		maintenanceType: string;
		description: string;
		status?: string;
		scheduledDate?: Date | null;
		cost?: number | null;
		technicianName?: string | null;
		technicianContact?: string | null;
		notes?: string | null;
	},
	userId: string
): Promise<{ success: boolean; error?: string; maintenance?: schema.EquipmentMaintenance }> {
	try {
		const equipment = await getEquipmentById(db, data.equipmentId);
		if (!equipment) {
			return { success: false, error: 'EQUIPMENT_NOT_FOUND' };
		}

		if (!data.description || data.description.trim().length === 0) {
			return { success: false, error: 'DESCRIPTION_REQUIRED' };
		}

		const maintenanceId = generateUniqueId();

		const [maintenance] = await db
			.insert(schema.equipmentMaintenance)
			.values({
				id: maintenanceId,
				equipmentId: data.equipmentId,
				maintenanceType: data.maintenanceType,
				description: data.description.trim(),
				status: data.status || 'scheduled',
				scheduledDate: data.scheduledDate || null,
				cost: data.cost || null,
				technicianName: data.technicianName?.trim() || null,
				technicianContact: data.technicianContact?.trim() || null,
				notes: data.notes?.trim() || null,
				createdById: userId
			})
			.returning();

		// Update equipment status to maintenance if needed
		if (data.status === 'in_progress' || data.status === 'scheduled') {
			await db
				.update(schema.equipment)
				.set({
					status: 'maintenance',
					updatedById: userId,
					updatedAt: new Date()
				})
				.where(eq(schema.equipment.id, data.equipmentId));
		}

		await createAuditLog(db, 'equipment.maintenance.created', userId, {
			maintenanceId,
			equipmentId: data.equipmentId,
			maintenanceType: data.maintenanceType
		});

		return { success: true, maintenance };
	} catch (error) {
		return { success: false, error: 'MAINTENANCE_CREATE_FAILED' };
	}
}

export async function getMaintenanceHistory(
	db: PostgresJsDatabase<typeof schema>,
	equipmentId: string
): Promise<schema.EquipmentMaintenance[]> {
	return await db
		.select()
		.from(schema.equipmentMaintenance)
		.where(eq(schema.equipmentMaintenance.equipmentId, equipmentId))
		.orderBy(desc(schema.equipmentMaintenance.createdAt));
}

export async function listLocations(
	db: PostgresJsDatabase<typeof schema>
): Promise<schema.Location[]> {
	return await db
		.select()
		.from(schema.location)
		.where(isNull(schema.location.deletedAt))
		.orderBy(schema.location.name);
}

export async function createLocation(
	db: PostgresJsDatabase<typeof schema>,
	data: {
		name: string;
		description?: string | null;
		address?: string | null;
		building?: string | null;
		floor?: string | null;
		room?: string | null;
	},
	userId: string
): Promise<{ success: boolean; error?: string; location?: schema.Location }> {
	try {
		if (!data.name || data.name.trim().length === 0) {
			return { success: false, error: 'NAME_REQUIRED' };
		}

		const locationId = generateUniqueId();

		const [location] = await db
			.insert(schema.location)
			.values({
				id: locationId,
				name: data.name.trim(),
				description: data.description?.trim() || null,
				address: data.address?.trim() || null,
				building: data.building?.trim() || null,
				floor: data.floor?.trim() || null,
				room: data.room?.trim() || null,
				createdById: userId
			})
			.returning();

		return { success: true, location };
	} catch (error) {
		return { success: false, error: 'LOCATION_CREATE_FAILED' };
	}
}
