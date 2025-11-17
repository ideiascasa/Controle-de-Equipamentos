import * as auth from '$lib/utils/auth';
import { redirect, error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/db/schema';
import { getEquipmentById, getMovementHistory, getMaintenanceHistory } from '../utils.server';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		throw redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async ({ params }) => {
	requireLogin();

	const equipment = await getEquipmentById(db, params.id);

	if (!equipment) {
		throw error(404, 'Equipamento nao encontrado');
	}

	// Get related data
	const [currentLocation] = equipment.currentLocationId
		? await db
				.select()
				.from(schema.location)
				.where(eq(schema.location.id, equipment.currentLocationId))
				.limit(1)
		: [null];

	const [currentUser] = equipment.currentUserId
		? await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.id, equipment.currentUserId))
				.limit(1)
		: [null];

	const [createdBy] = equipment.createdById
		? await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.id, equipment.createdById))
				.limit(1)
		: [null];

	const movements = await getMovementHistory(db, params.id, 10);
	const maintenances = await getMaintenanceHistory(db, params.id, 10);

	return {
		equipment,
		currentLocation,
		currentUser,
		createdBy,
		movements,
		maintenances
	};
};
