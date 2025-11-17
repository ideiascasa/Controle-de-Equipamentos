import { redirect, fail } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { getEquipmentWithDetails, getLocations, getUsers } from '../../utils.server';
import { generateUniqueId } from '$lib/utils/common';
import { createAuditLog } from '$lib/utils/audit';
import { eq, and, isNull } from 'drizzle-orm';
import * as schema from '$lib/db/schema';

export const load: PageServerLoad = async ({ params }) => {
	const result = requireLogin();

	const equipmentData = await getEquipmentWithDetails(db, params.id);

	if (!equipmentData) {
		return redirect(302, '/equipment');
	}

	const locations = await getLocations(db);
	const users = await getUsers(db);

	return {
		...result,
		equipment: equipmentData.equipment,
		location: equipmentData.location,
		user: equipmentData.user,
		locations,
		users
	};
};

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const actions: Actions = {
	moveEquipment: async (event) => {
		const { locals, params } = event;

		if (!locals.user) {
			return fail(401, { action: 'moveEquipment', message: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const toLocationId = formData.get('toLocationId')?.toString() || null;
		const toUserId = formData.get('toUserId')?.toString() || null;
		const reason = formData.get('reason')?.toString() || null;
		const notes = formData.get('notes')?.toString() || null;

		// Get equipment
		const equipmentData = await getEquipmentWithDetails(db, params.id);
		if (!equipmentData) {
			return fail(404, { action: 'moveEquipment', message: 'EQUIPMENT_NOT_FOUND' });
		}

		const movementId = generateUniqueId();
		const now = new Date();

		// For now, we'll create movements as completed (no authorization required)
		// In a full implementation, you'd check if authorization is needed
		try {
			await db.insert(schema.equipmentMovement).values({
				id: movementId,
				equipmentId: params.id,
				fromLocationId: equipmentData.equipment.currentLocationId,
				toLocationId,
				fromUserId: equipmentData.equipment.currentUserId,
				toUserId,
				requestedById: locals.user.id,
				status: 'completed',
				reason,
				notes,
				requestedAt: now,
				completedAt: now,
				createdAt: now
			});

			// Update equipment location and user
			await db
				.update(schema.equipment)
				.set({
					currentLocationId: toLocationId,
					currentUserId: toUserId,
					updatedAt: now,
					updatedById: locals.user.id
				})
				.where(eq(schema.equipment.id, params.id));

			await createAuditLog(db, 'equipment.movement.completed', locals.user.id, {
				movementId,
				equipmentId: params.id,
				toLocationId,
				toUserId
			});

			return redirect(303, `/equipment/${params.id}`);
		} catch (error) {
			return fail(500, { action: 'moveEquipment', message: 'MOVEMENT_FAILED' });
		}
	}
};
