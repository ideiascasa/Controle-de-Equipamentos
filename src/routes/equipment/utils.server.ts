import { eq, and, isNull, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '$lib/db/schema';
import { generateUniqueId } from '$lib/utils/common';

export async function getEquipmentList(
	db: PostgresJsDatabase<typeof schema>,
	userId: string
): Promise<
	Array<{
		equipment: schema.Equipment;
		currentLocation: schema.Location | null;
		currentUser: { id: string; username: string; name: string | null } | null;
	}>
> {
	const results = await db
		.select({
			equipment: schema.equipment,
			currentLocation: schema.location,
			currentUser: {
				id: schema.user.id,
				username: schema.user.username,
				name: schema.user.name
			}
		})
		.from(schema.equipment)
		.leftJoin(schema.location, eq(schema.equipment.currentLocationId, schema.location.id))
		.leftJoin(schema.user, eq(schema.equipment.currentUserId, schema.user.id))
		.where(isNull(schema.equipment.deletedAt));

	return results;
}

export async function getEquipmentById(
	db: PostgresJsDatabase<typeof schema>,
	equipmentId: string
): Promise<{
	equipment: schema.Equipment;
	currentLocation: schema.Location | null;
	currentUser: { id: string; username: string; name: string | null } | null;
} | null> {
	const results = await db
		.select({
			equipment: schema.equipment,
			currentLocation: schema.location,
			currentUser: {
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

	return results.length > 0 ? results[0] : null;
}

export async function getActiveLocations(
	db: PostgresJsDatabase<typeof schema>
): Promise<schema.Location[]> {
	return await db
		.select()
		.from(schema.location)
		.where(and(eq(schema.location.isActive, true), isNull(schema.location.deletedAt)));
}

export async function getEquipmentMovements(
	db: PostgresJsDatabase<typeof schema>,
	equipmentId: string
): Promise<
	Array<{
		movement: schema.EquipmentMovement;
		fromLocation: schema.Location | null;
		toLocation: schema.Location | null;
		requestedBy: { id: string; username: string; name: string | null } | null;
		authorizedBy: { id: string; username: string; name: string | null } | null;
	}>
> {
	// Get movements with basic joins (simplified to avoid multiple joins on same table)
	const movements = await db
		.select()
		.from(schema.equipmentMovement)
		.where(eq(schema.equipmentMovement.equipmentId, equipmentId))
		.orderBy(schema.equipmentMovement.requestedAt);

	// Fetch related data separately
	const results = await Promise.all(
		movements.map(async (movement) => {
			const [fromLocation, toLocation, requestedBy, authorizedBy] = await Promise.all([
				movement.fromLocationId
					? db
							.select()
							.from(schema.location)
							.where(eq(schema.location.id, movement.fromLocationId))
							.limit(1)
							.then((r) => r[0] || null)
					: Promise.resolve(null),
				movement.toLocationId
					? db
							.select()
							.from(schema.location)
							.where(eq(schema.location.id, movement.toLocationId))
							.limit(1)
							.then((r) => r[0] || null)
					: Promise.resolve(null),
				movement.requestedById
					? db
							.select({
								id: schema.user.id,
								username: schema.user.username,
								name: schema.user.name
							})
							.from(schema.user)
							.where(eq(schema.user.id, movement.requestedById))
							.limit(1)
							.then((r) => r[0] || null)
					: Promise.resolve(null),
				movement.authorizedById
					? db
							.select({
								id: schema.user.id,
								username: schema.user.username,
								name: schema.user.name
							})
							.from(schema.user)
							.where(eq(schema.user.id, movement.authorizedById))
							.limit(1)
							.then((r) => r[0] || null)
					: Promise.resolve(null)
			]);

			return {
				movement,
				fromLocation,
				toLocation,
				requestedBy,
				authorizedBy
			};
		})
	);

	return results;
}

export async function getEquipmentMaintenances(
	db: PostgresJsDatabase<typeof schema>,
	equipmentId: string
): Promise<
	Array<{
		maintenance: schema.EquipmentMaintenance;
		registeredBy: { id: string; username: string; name: string | null } | null;
	}>
> {
	const results = await db
		.select({
			maintenance: schema.equipmentMaintenance,
			registeredBy: {
				id: schema.user.id,
				username: schema.user.username,
				name: schema.user.name
			}
		})
		.from(schema.equipmentMaintenance)
		.leftJoin(schema.user, eq(schema.equipmentMaintenance.registeredById, schema.user.id))
		.where(eq(schema.equipmentMaintenance.equipmentId, equipmentId))
		.orderBy(schema.equipmentMaintenance.startDate);

	return results;
}
