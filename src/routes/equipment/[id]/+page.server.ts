import { redirect, error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { getEquipmentWithDetails } from '../utils.server';
import { eq, and, isNull } from 'drizzle-orm';
import * as schema from '$lib/db/schema';

export const load: PageServerLoad = async ({ params }) => {
	const result = requireLogin();

	const equipmentData = await getEquipmentWithDetails(db, params.id);

	if (!equipmentData) {
		return error(404, 'Equipamento não encontrado');
	}

	// Get movement history - simplified query
	const movementsData = await db
		.select()
		.from(schema.equipmentMovement)
		.where(eq(schema.equipmentMovement.equipmentId, params.id))
		.orderBy(schema.equipmentMovement.requestedAt);

	// Get related data for movements
	const movements = await Promise.all(
		movementsData.map(async (movement) => {
			const [fromLocation] = movement.fromLocationId
				? await db
						.select({ id: schema.location.id, name: schema.location.name })
						.from(schema.location)
						.where(eq(schema.location.id, movement.fromLocationId))
						.limit(1)
				: [null];

			const [toLocation] = movement.toLocationId
				? await db
						.select({ id: schema.location.id, name: schema.location.name })
						.from(schema.location)
						.where(eq(schema.location.id, movement.toLocationId))
						.limit(1)
				: [null];

			const [requestedBy] = await db
				.select({ id: schema.user.id, username: schema.user.username, name: schema.user.name })
				.from(schema.user)
				.where(eq(schema.user.id, movement.requestedById))
				.limit(1);

			const [authorizedBy] = movement.authorizedById
				? await db
						.select({ id: schema.user.id, username: schema.user.username, name: schema.user.name })
						.from(schema.user)
						.where(eq(schema.user.id, movement.authorizedById))
						.limit(1)
				: [null];

			return {
				movement,
				fromLocation,
				toLocation,
				requestedBy,
				authorizedBy
			};
		})
	);

	// Get maintenance history
	const maintenances = await db
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
		.where(eq(schema.equipmentMaintenance.equipmentId, params.id))
		.orderBy(schema.equipmentMaintenance.startDate);

	return {
		...result,
		equipment: equipmentData.equipment,
		location: equipmentData.location,
		user: equipmentData.user,
		movements,
		maintenances
	};
};

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}
