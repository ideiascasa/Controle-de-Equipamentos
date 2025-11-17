import { redirect, fail } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { createEquipment, getLocations, getUsers } from '../utils.server';

export const load: PageServerLoad = async () => {
	const result = requireLogin();

	// Check if user is administrator
	const isAdministrator = result.groups?.some((group) => group.isAdmin === true) ?? false;
	if (!isAdministrator) {
		return redirect(302, '/equipment');
	}

	const locations = await getLocations(db);
	const users = await getUsers(db);

	return {
		...result,
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
	createEquipment: async (event) => {
		const { locals } = event;

		if (!locals.user || !locals.groups) {
			return fail(401, { action: 'createEquipment', message: 'UNAUTHORIZED' });
		}

		const isAdministrator = locals.groups.some((group) => group.isAdmin === true);
		if (!isAdministrator) {
			return fail(403, { action: 'createEquipment', message: 'NOT_ADMINISTRATOR' });
		}

		const formData = await event.request.formData();
		const fields: Record<string, FormDataEntryValue | null> = {};
		formData.forEach((value, key) => {
			fields[key] = value;
		});

		const result = await createEquipment(db, fields, locals.user.id);
		if (!result.success) {
			const status =
				result.error === 'CODE_REQUIRED' ||
				result.error === 'NAME_REQUIRED' ||
				result.error === 'CODE_ALREADY_EXISTS'
					? 400
					: 500;
			return fail(status, { action: 'createEquipment', message: result.error });
		}

		return redirect(303, `/equipment/${result.equipment?.id}`);
	}
};
