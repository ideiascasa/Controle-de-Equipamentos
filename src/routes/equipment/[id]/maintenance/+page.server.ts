import { redirect, fail } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { getEquipmentWithDetails } from '../../utils.server';
import { generateUniqueId } from '$lib/utils/common';
import { createAuditLog } from '$lib/utils/audit';
import { eq, and, isNull } from 'drizzle-orm';
import * as schema from '$lib/db/schema';

export const load: PageServerLoad = async ({ params }) => {
	const result = requireLogin();

	const equipmentData = await getEquipmentWithDetails(db, params.id);

	if (!equipmentData) {
		return redirect(302, '/equipment');
	}

	return {
		...result,
		equipment: equipmentData.equipment,
		location: equipmentData.location,
		user: equipmentData.user
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
	registerMaintenance: async (event) => {
		const { locals, params } = event;

		if (!locals.user) {
			return fail(401, { action: 'registerMaintenance', message: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const type = formData.get('type')?.toString();
		const description = formData.get('description')?.toString();
		const provider = formData.get('provider')?.toString() || null;
		const cost = formData.get('cost')?.toString();
		const startDate = formData.get('startDate')?.toString();
		const endDate = formData.get('endDate')?.toString() || null;
		const status = formData.get('status')?.toString() || 'scheduled';
		const nextMaintenanceDate = formData.get('nextMaintenanceDate')?.toString() || null;
		const notes = formData.get('notes')?.toString() || null;

		if (!type || !description || !startDate) {
			return fail(400, { action: 'registerMaintenance', message: 'MISSING_REQUIRED_FIELDS' });
		}

		// Get equipment
		const equipmentData = await getEquipmentWithDetails(db, params.id);
		if (!equipmentData) {
			return fail(404, { action: 'registerMaintenance', message: 'EQUIPMENT_NOT_FOUND' });
		}

		const maintenanceId = generateUniqueId();
		const now = new Date();

		try {
			await db.insert(schema.equipmentMaintenance).values({
				id: maintenanceId,
				equipmentId: params.id,
				type: type as 'preventive' | 'corrective' | 'calibration',
				description,
				provider,
				cost: cost ? parseInt(cost) : null,
				startDate: new Date(startDate),
				endDate: endDate ? new Date(endDate) : null,
				status: status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
				nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
				notes,
				registeredById: locals.user.id,
				createdAt: now
			});

			// Update equipment status if maintenance is in progress or scheduled
			if (status === 'in_progress' || status === 'scheduled') {
				await db
					.update(schema.equipment)
					.set({
						status: 'maintenance',
						updatedAt: now,
						updatedById: locals.user.id
					})
					.where(eq(schema.equipment.id, params.id));
			}

			await createAuditLog(db, 'equipment.maintenance.registered', locals.user.id, {
				maintenanceId,
				equipmentId: params.id,
				type,
				status
			});

			return redirect(303, `/equipment/${params.id}`);
		} catch (error) {
			return fail(500, { action: 'registerMaintenance', message: 'MAINTENANCE_REGISTRATION_FAILED' });
		}
	}
};
