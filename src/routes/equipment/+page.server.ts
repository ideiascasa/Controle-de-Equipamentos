import { fail, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { createAuditLog } from '$lib/utils/audit';
import { generateUniqueId } from '$lib/utils/common';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async () => {
	const result = requireLogin();

	try {
		const equipmentList = await db
			.select({
				id: schema.equipment.id,
				name: schema.equipment.name,
				description: schema.equipment.description,
				serialNumber: schema.equipment.serialNumber,
				model: schema.equipment.model,
				manufacturer: schema.equipment.manufacturer,
				category: schema.equipment.category,
				status: schema.equipment.status,
				currentLocationId: schema.equipment.currentLocationId,
				createdAt: schema.equipment.createdAt
			})
			.from(schema.equipment)
			.where(isNull(schema.equipment.deletedAt));

		const locations = await db
			.select({
				id: schema.location.id,
				name: schema.location.name
			})
			.from(schema.location)
			.where(isNull(schema.location.deletedAt));

		const locationMap = new Map(locations.map((loc) => [loc.id, loc.name]));

		return {
			equipment: equipmentList.map((eq) => ({
				...eq,
				locationName: eq.currentLocationId ? locationMap.get(eq.currentLocationId) || null : null
			}))
		};
	} catch (error) {
		console.error('Error loading equipment:', error);
		return {
			equipment: []
		};
	}
};

export const actions: Actions = {
	delete: async (event) => {
		const { locals } = event;

		if (!locals.user) {
			return fail(401, { action: 'delete', message: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const equipmentId = formData.get('id');

		if (!equipmentId || typeof equipmentId !== 'string') {
			return fail(400, { action: 'delete', message: 'INVALID_ID' });
		}

		try {
			await db
				.update(schema.equipment)
				.set({
					deletedAt: new Date(),
					deletedById: locals.user.id
				})
				.where(eq(schema.equipment.id, equipmentId));

			await createAuditLog(db, 'equipment.deleted', locals.user.id, {
				equipmentId
			});

			return { action: 'delete', success: true };
		} catch (error) {
			console.error('Error deleting equipment:', error);
			return fail(500, { action: 'delete', message: 'DATABASE_ERROR' });
		}
	}
};
