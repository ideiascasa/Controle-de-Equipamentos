import { eq, and, isNull, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '$lib/db/schema';
import { generateUniqueId } from '$lib/utils/common';
import { createAuditLog } from '$lib/utils/audit';

export interface EquipmentFormData {
	name: string;
	description?: string;
	serialNumber?: string;
	category?: string;
	status?: string;
	currentLocation?: string;
	currentUserId?: string;
	groupId?: string;
	imageUrl?: string;
}

export async function createEquipment(
	db: PostgresJsDatabase<typeof schema>,
	data: EquipmentFormData,
	createdById: string
): Promise<{ success: boolean; error?: string; equipment?: schema.Equipment }> {
	// Validate required fields
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
			.where(
				and(
					eq(schema.equipment.serialNumber, data.serialNumber),
					isNull(schema.equipment.deletedAt)
				)
			)
			.limit(1);

		if (existing.length > 0) {
			return { success: false, error: 'SERIAL_NUMBER_ALREADY_EXISTS' };
		}
	}

	const equipmentId = generateUniqueId();
	const now = new Date();

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
				currentLocation: data.currentLocation?.trim() || null,
				currentUserId: data.currentUserId || null,
				groupId: data.groupId || null,
				imageUrl: data.imageUrl?.trim() || null,
				createdById,
				createdAt: now
			})
			.returning();

		// Create location history entry
		await db.insert(schema.equipmentLocationHistory).values({
			id: generateUniqueId(),
			equipmentId: equipmentId,
			location: data.currentLocation?.trim() || 'Criado',
			action: 'created',
			performedById: createdById,
			notes: 'Equipamento criado'
		});

		// Audit log
		await createAuditLog(db, 'equipment.created', createdById, {
			equipmentId,
			name: data.name,
			serialNumber: data.serialNumber
		});

		return { success: true, equipment };
	} catch (error) {
		console.error('Error creating equipment:', error);
		return { success: false, error: 'EQUIPMENT_CREATE_FAILED' };
	}
}

export async function updateEquipment(
	db: PostgresJsDatabase<typeof schema>,
	equipmentId: string,
	data: EquipmentFormData,
	updatedById: string
): Promise<{ success: boolean; error?: string; equipment?: schema.Equipment }> {
	// Validate required fields
	if (!data.name || data.name.trim().length === 0) {
		return { success: false, error: 'EQUIPMENT_NAME_REQUIRED' };
	}

	if (data.name.length > 255) {
		return { success: false, error: 'EQUIPMENT_NAME_TOO_LONG' };
	}

	// Check if equipment exists
	const [existing] = await db
		.select()
		.from(schema.equipment)
		.where(and(eq(schema.equipment.id, equipmentId), isNull(schema.equipment.deletedAt)))
		.limit(1);

	if (!existing) {
		return { success: false, error: 'EQUIPMENT_NOT_FOUND' };
	}

	// Check serial number uniqueness if provided and changed
	if (data.serialNumber && data.serialNumber !== existing.serialNumber) {
		const duplicate = await db
			.select()
			.from(schema.equipment)
			.where(
				and(
					eq(schema.equipment.serialNumber, data.serialNumber),
					isNull(schema.equipment.deletedAt),
					sql`${schema.equipment.id} != ${equipmentId}`
				)
			)
			.limit(1);

		if (duplicate.length > 0) {
			return { success: false, error: 'SERIAL_NUMBER_ALREADY_EXISTS' };
		}
	}

	const now = new Date();

	try {
		const [equipment] = await db
			.update(schema.equipment)
			.set({
				name: data.name.trim(),
				description: data.description?.trim() || null,
				serialNumber: data.serialNumber?.trim() || null,
				category: data.category?.trim() || null,
				status: data.status || existing.status,
				currentLocation: data.currentLocation?.trim() || existing.currentLocation,
				currentUserId: data.currentUserId || existing.currentUserId,
				groupId: data.groupId || existing.groupId,
				imageUrl: data.imageUrl?.trim() || existing.imageUrl,
				updatedById,
				updatedAt: now
			})
			.where(eq(schema.equipment.id, equipmentId))
			.returning();

		// Audit log
		await createAuditLog(db, 'equipment.updated', updatedById, {
			equipmentId,
			changes: {
				name: data.name !== existing.name,
				status: data.status !== existing.status,
				location: data.currentLocation !== existing.currentLocation
			}
		});

		return { success: true, equipment };
	} catch (error) {
		console.error('Error updating equipment:', error);
		return { success: false, error: 'EQUIPMENT_UPDATE_FAILED' };
	}
}

export interface MovementFormData {
	equipmentId: string;
	toLocation: string;
	fromLocation?: string;
	toUserId?: string;
	fromUserId?: string;
	notes?: string;
}

export async function createMovement(
	db: PostgresJsDatabase<typeof schema>,
	data: MovementFormData,
	requestedById: string
): Promise<{ success: boolean; error?: string; movement?: schema.EquipmentMovement }> {
	// Validate required fields
	if (!data.equipmentId) {
		return { success: false, error: 'EQUIPMENT_ID_REQUIRED' };
	}

	if (!data.toLocation || data.toLocation.trim().length === 0) {
		return { success: false, error: 'TO_LOCATION_REQUIRED' };
	}

	// Check if equipment exists and is available
	const [equipment] = await db
		.select()
		.from(schema.equipment)
		.where(and(eq(schema.equipment.id, data.equipmentId), isNull(schema.equipment.deletedAt)))
		.limit(1);

	if (!equipment) {
		return { success: false, error: 'EQUIPMENT_NOT_FOUND' };
	}

	// Check if equipment is available or allocated to requesting user
	if (equipment.status !== 'available' && equipment.currentUserId !== requestedById) {
		return { success: false, error: 'EQUIPMENT_NOT_AVAILABLE' };
	}

	const movementId = generateUniqueId();
	const now = new Date();

	try {
		const [movement] = await db
			.insert(schema.equipmentMovement)
			.values({
				id: movementId,
				equipmentId: data.equipmentId,
				fromLocation: data.fromLocation?.trim() || equipment.currentLocation || null,
				toLocation: data.toLocation.trim(),
				fromUserId: data.fromUserId || equipment.currentUserId || null,
				toUserId: data.toUserId || null,
				status: 'pending',
				requestedById,
				notes: data.notes?.trim() || null,
				createdAt: now
			})
			.returning();

		// Update equipment status
		await db
			.update(schema.equipment)
			.set({
				status: 'pending_movement',
				updatedAt: now
			})
			.where(eq(schema.equipment.id, data.equipmentId));

		// Audit log
		await createAuditLog(db, 'movement.requested', requestedById, {
			movementId,
			equipmentId: data.equipmentId,
			toLocation: data.toLocation
		});

		return { success: true, movement };
	} catch (error) {
		console.error('Error creating movement:', error);
		return { success: false, error: 'MOVEMENT_CREATE_FAILED' };
	}
}

export async function approveMovement(
	db: PostgresJsDatabase<typeof schema>,
	movementId: string,
	approvedById: string
): Promise<{ success: boolean; error?: string }> {
	// Get movement
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

	// Get equipment
	const [equipment] = await db
		.select()
		.from(schema.equipment)
		.where(and(eq(schema.equipment.id, movement.equipmentId), isNull(schema.equipment.deletedAt)))
		.limit(1);

	if (!equipment) {
		return { success: false, error: 'EQUIPMENT_NOT_FOUND' };
	}

	const now = new Date();

	try {
		// Update movement
		await db
			.update(schema.equipmentMovement)
			.set({
				status: 'approved',
				approvedById,
				approvedAt: now,
				updatedAt: now
			})
			.where(eq(schema.equipmentMovement.id, movementId));

		// Update equipment
		await db
			.update(schema.equipment)
			.set({
				currentLocation: movement.toLocation,
				currentUserId: movement.toUserId || equipment.currentUserId,
				status: 'allocated',
				updatedAt: now
			})
			.where(eq(schema.equipment.id, movement.equipmentId));

		// Create location history
		await db.insert(schema.equipmentLocationHistory).values({
			id: generateUniqueId(),
			equipmentId: movement.equipmentId,
			movementId: movementId,
			location: movement.toLocation,
			userId: movement.toUserId || null,
			action: 'approved',
			performedById: approvedById,
			notes: 'Movimentacao aprovada'
		});

		// Audit log
		await createAuditLog(db, 'movement.approved', approvedById, {
			movementId,
			equipmentId: movement.equipmentId
		});

		return { success: true };
	} catch (error) {
		console.error('Error approving movement:', error);
		return { success: false, error: 'MOVEMENT_APPROVE_FAILED' };
	}
}
