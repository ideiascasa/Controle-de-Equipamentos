import { redirect, fail } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { getUserGroupsAndAdmin } from '$lib/utils/common';
import { createEquipment } from '../utils.server';

export const load: PageServerLoad = async () => {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		redirect(302, '/user/login');
	}

	const userGroups = await getUserGroupsAndAdmin(db, locals.user.id);
	const isAdmin = userGroups.some((g) => g.isAdmin === true);

	if (!isAdmin) {
		redirect(302, '/equipment');
	}

	// Get all groups for selection
	const groups = await db.select().from(schema.group);

	return {
		groups,
		userGroups
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals } = event;

		if (!locals.user) {
			return fail(401, { action: 'create', message: 'UNAUTHORIZED' });
		}

		const userGroups = await getUserGroupsAndAdmin(db, locals.user.id);
		const isAdmin = userGroups.some((g) => g.isAdmin === true);

		if (!isAdmin) {
			return fail(403, { action: 'create', message: 'NOT_ADMINISTRATOR' });
		}

		const formData = await event.request.formData();
		const data = {
			name: formData.get('name')?.toString() || '',
			description: formData.get('description')?.toString(),
			serialNumber: formData.get('serialNumber')?.toString(),
			category: formData.get('category')?.toString(),
			status: formData.get('status')?.toString() || 'available',
			currentLocation: formData.get('currentLocation')?.toString(),
			currentUserId: formData.get('currentUserId')?.toString(),
			groupId: formData.get('groupId')?.toString(),
			imageUrl: formData.get('imageUrl')?.toString()
		};

		const result = await createEquipment(db, data, locals.user.id);

		if (!result.success) {
			return fail(400, { action: 'create', message: result.error });
		}

		redirect(303, `/equipment/${result.equipment?.id}`);
	}
};
