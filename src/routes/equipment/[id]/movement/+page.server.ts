import { getRequestEvent } from '$app/server';
import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import { getEquipmentById, createMovement, listLocations } from '../../utils.server';
import { enhance } from '$app/forms';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async ({ params }) => {
	const result = requireLogin();

	const equipment = await getEquipmentById(db, params.id);

	if (!equipment) {
		return redirect(302, '/equipment');
	}

	const locations = await listLocations(db);

	return {
		equipment,
		locations,
		userId: result.user?.id
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals, params } = event;

		if (!locals.user) {
			return fail(401, { error: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const toLocationId = formData.get('toLocationId')?.toString();
		const toUserId = formData.get('toUserId')?.toString();
		const reason = formData.get('reason')?.toString();

		const result = await createMovement(
			db,
			{
				equipmentId: params.id,
				toLocationId: toLocationId || null,
				toUserId: toUserId || null,
				reason: reason || null
			},
			locals.user.id
		);

		if (!result.success) {
			return fail(400, { error: result.error });
		}

		return redirect(303, `/equipment/${params.id}`);
	}
};
