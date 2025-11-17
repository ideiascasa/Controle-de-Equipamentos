import { fail, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { createAuditLog } from '$lib/utils/audit';
import { generateUniqueId } from '$lib/utils/common';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const actions: Actions = {
	default: async (event) => {
		const { locals } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const name = formData.get('name');
		const description = formData.get('description');
		const address = formData.get('address');
		const building = formData.get('building');
		const floor = formData.get('floor');
		const room = formData.get('room');
		const isActive = formData.get('isActive') !== 'false';

		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return fail(400, { message: 'NAME_REQUIRED' });
		}

		try {
			const locationId = generateUniqueId();

			await db.insert(schema.location).values({
				id: locationId,
				name: name.trim(),
				description: description && typeof description === 'string' ? description.trim() : null,
				address: address && typeof address === 'string' ? address.trim() : null,
				building: building && typeof building === 'string' ? building.trim() : null,
				floor: floor && typeof floor === 'string' ? floor.trim() : null,
				room: room && typeof room === 'string' ? room.trim() : null,
				isActive,
				createdById: locals.user.id
			});

			await createAuditLog(db, 'location.created', locals.user.id, {
				locationId,
				name: name.trim()
			});

			return redirect(303, '/location');
		} catch (error) {
			console.error('Error creating location:', error);
			return fail(500, { message: 'DATABASE_ERROR' });
		}
	}
};
