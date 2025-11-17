import * as auth from '$lib/utils/auth';
import { redirect, fail, error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import { getEquipmentById, createMaintenance, getAllUsers } from '../../utils.server';

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

	const users = await getAllUsers(db);

	return {
		equipment,
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
		const maintenanceType = formData.get('maintenanceType');
		const description = formData.get('description');
		const cost = formData.get('cost');
		const performedById = formData.get('performedById');
		const authorizedById = formData.get('authorizedById');
		const startDate = formData.get('startDate');
		const endDate = formData.get('endDate');
		const status = formData.get('status');

		if (!maintenanceType || typeof maintenanceType !== 'string') {
			return fail(400, { message: 'MAINTENANCE_TYPE_REQUIRED' });
		}

		if (!description || typeof description !== 'string') {
			return fail(400, { message: 'MAINTENANCE_DESCRIPTION_REQUIRED' });
		}

		const equipment = await getEquipmentById(db, params.id);
		if (!equipment) {
			return fail(404, { message: 'EQUIPMENT_NOT_FOUND' });
		}

		const result = await createMaintenance(
			db,
			{
				equipmentId: params.id,
				maintenanceType,
				description,
				cost: cost ? parseInt(cost.toString()) : null,
				performedById: performedById?.toString() || null,
				authorizedById: authorizedById?.toString() || null,
				startDate: startDate ? new Date(startDate.toString()) : null,
				endDate: endDate ? new Date(endDate.toString()) : null,
				status: status?.toString() || null
			},
			locals.user.id
		);

		if (!result.success) {
			return fail(400, { message: result.error || 'MAINTENANCE_CREATE_FAILED' });
		}

		throw redirect(303, `/equipment/${params.id}`);
	}
};
