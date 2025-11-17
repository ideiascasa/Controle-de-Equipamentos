import { getRequestEvent } from '$app/server';
import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { getEquipmentById, getMovementHistory, getMaintenanceHistory } from '../utils.server';
import * as schema from '$lib/db/schema';
import { eq } from 'drizzle-orm';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async ({ params }) => {
	requireLogin();

	const equipment = await getEquipmentById(db, params.id);

	if (!equipment) {
		error(404, 'Equipment not found');
	}

	// Get current location and user
	let currentLocation = null;
	let currentUser = null;

	if (equipment.currentLocationId) {
		const [location] = await db
			.select()
			.from(schema.location)
			.where(eq(schema.location.id, equipment.currentLocationId))
			.limit(1);
		currentLocation = location || null;
	}

	if (equipment.currentUserId) {
		const [user] = await db
			.select()
			.from(schema.user)
			.where(eq(schema.user.id, equipment.currentUserId))
			.limit(1);
		currentUser = user || null;
	}

	const movements = await getMovementHistory(db, params.id);
	const maintenances = await getMaintenanceHistory(db, params.id);

	return {
		equipment,
		currentLocation,
		currentUser,
		movements,
		maintenances
	};
};
