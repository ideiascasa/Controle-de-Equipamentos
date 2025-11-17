import { getRequestEvent } from '$app/server';
import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import { getEquipmentById, createMaintenance } from '../../utils.server';
import { enhance } from '$app/forms';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async ({ params }) => {
	requireLogin();

	const equipment = await getEquipmentById(db, params.id);

	if (!equipment) {
		return redirect(302, '/equipment');
	}

	return {
		equipment
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals, params } = event;

		if (!locals.user) {
			return fail(401, { error: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const maintenanceType = formData.get('maintenanceType')?.toString() || 'preventive';
		const description = formData.get('description')?.toString() || '';
		const status = formData.get('status')?.toString() || 'scheduled';
		const scheduledDateStr = formData.get('scheduledDate')?.toString();
		const costStr = formData.get('cost')?.toString();
		const technicianName = formData.get('technicianName')?.toString();
		const technicianContact = formData.get('technicianContact')?.toString();
		const notes = formData.get('notes')?.toString();

		const scheduledDate = scheduledDateStr ? new Date(scheduledDateStr) : null;
		const cost = costStr ? parseInt(costStr, 10) : null;

		const result = await createMaintenance(
			db,
			{
				equipmentId: params.id,
				maintenanceType,
				description,
				status,
				scheduledDate,
				cost,
				technicianName: technicianName || null,
				technicianContact: technicianContact || null,
				notes: notes || null
			},
			locals.user.id
		);

		if (!result.success) {
			return fail(400, { error: result.error });
		}

		return redirect(303, `/equipment/${params.id}`);
	}
};
