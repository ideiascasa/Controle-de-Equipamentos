import { fail, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { createAuditLog } from '$lib/utils/audit';

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
		const locations = await db
			.select()
			.from(schema.location)
			.where(isNull(schema.location.deletedAt));

		return {
			locations
		};
	} catch (error) {
		console.error('Error loading locations:', error);
		return {
			locations: []
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
		const locationId = formData.get('id');

		if (!locationId || typeof locationId !== 'string') {
			return fail(400, { action: 'delete', message: 'INVALID_ID' });
		}

		try {
			await db
				.update(schema.location)
				.set({
					deletedAt: new Date(),
					deletedById: locals.user.id
				})
				.where(eq(schema.location.id, locationId));

			await createAuditLog(db, 'location.deleted', locals.user.id, {
				locationId
			});

			return { action: 'delete', success: true };
		} catch (error) {
			console.error('Error deleting location:', error);
			return fail(500, { action: 'delete', message: 'DATABASE_ERROR' });
		}
	}
};
