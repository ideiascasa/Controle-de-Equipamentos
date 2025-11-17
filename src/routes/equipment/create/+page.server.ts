import * as auth from '$lib/utils/auth';
import { redirect, fail } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import { createEquipment, getAllLocations, getAllUsers } from '../utils.server';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		throw redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async () => {
	const result = requireLogin();

	const locations = await getAllLocations(db);
	const users = await getAllUsers(db);

	return {
		locations,
		users
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const name = formData.get('name');
		const description = formData.get('description');
		const serialNumber = formData.get('serialNumber');
		const category = formData.get('category');
		const status = formData.get('status');
		const currentLocationId = formData.get('currentLocationId');
		const currentUserId = formData.get('currentUserId');

		if (!name || typeof name !== 'string') {
			return fail(400, { message: 'EQUIPMENT_NAME_REQUIRED' });
		}

		const result = await createEquipment(
			db,
			{
				name,
				description: description?.toString() || null,
				serialNumber: serialNumber?.toString() || null,
				category: category?.toString() || null,
				status: status?.toString() || null,
				currentLocationId: currentLocationId?.toString() || null,
				currentUserId: currentUserId?.toString() || null
			},
			locals.user.id
		);

		if (!result.success) {
			return fail(400, { message: result.error || 'EQUIPMENT_CREATE_FAILED' });
		}

		throw redirect(303, `/equipment/${result.equipment?.id}`);
	}
};
