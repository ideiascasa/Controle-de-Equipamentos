import * as auth from '$lib/utils/auth';
import { redirect, fail, error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import { getEquipmentById, createMovement, getAllLocations, getAllUsers } from '../../utils.server';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		throw redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async ({ params }) => {
	const result = requireLogin();

	const equipment = await getEquipmentById(db, params.id);

	if (!equipment) {
		throw error(404, 'Equipamento nao encontrado');
	}

	const locations = await getAllLocations(db);
	const users = await getAllUsers(db);

	return {
		equipment,
		locations,
		users
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals, params } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const toLocationId = formData.get('toLocationId');
		const toUserId = formData.get('toUserId');
		const authorizedById = formData.get('authorizedById');
		const reason = formData.get('reason');

		if (!toLocationId || typeof toLocationId !== 'string') {
			return fail(400, { message: 'DESTINATION_LOCATION_REQUIRED' });
		}

		const equipment = await getEquipmentById(db, params.id);
		if (!equipment) {
			return fail(404, { message: 'EQUIPMENT_NOT_FOUND' });
		}

		const result = await createMovement(
			db,
			{
				equipmentId: params.id,
				toLocationId,
				fromLocationId: equipment.currentLocationId || null,
				toUserId: toUserId?.toString() || null,
				fromUserId: equipment.currentUserId || null,
				authorizedById: authorizedById?.toString() || null,
				reason: reason?.toString() || null
			},
			locals.user.id
		);

		if (!result.success) {
			return fail(400, { message: result.error || 'MOVEMENT_CREATE_FAILED' });
		}

		throw redirect(303, `/equipment/${params.id}`);
	}
};
