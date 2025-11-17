import { redirect, fail, error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateUniqueId } from '$lib/utils/common';
import { createAuditLog } from '$lib/utils/audit';
import { getEquipmentById } from '../../utils.server';

export const load: PageServerLoad = async ({ params }) => {
	const result = requireLogin();

	const equipment = await getEquipmentById(db, params.id);

	if (!equipment) {
		throw error(404, 'Equipment not found');
	}

	const menu: MenuData = [
		{
			trigger: 'Equipamentos',
			items: [
				{
					title: 'Lista de Equipamentos',
					href: '/equipment',
					description: 'Visualizar todos os equipamentos cadastrados.'
				},
				{
					title: 'Registrar Manutencao',
					href: `/equipment/${params.id}/maintenance`,
					description: 'Registrar manutencao do equipamento.'
				}
			]
		}
	];

	return {
		...result,
		menu,
		equipment
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

		const equipment = await getEquipmentById(db, params.id);

		if (!equipment) {
			return fail(404, { action: 'registerMaintenance', message: 'EQUIPMENT_NOT_FOUND' });
		}

		const formData = await event.request.formData();
		const type = formData.get('type');
		const description = formData.get('description');
		const provider = formData.get('provider');
		const cost = formData.get('cost');
		const startDate = formData.get('startDate');
		const endDate = formData.get('endDate');
		const status = formData.get('status') || 'scheduled';
		const nextMaintenanceDate = formData.get('nextMaintenanceDate');
		const notes = formData.get('notes');

		if (!type || typeof type !== 'string') {
			return fail(400, { action: 'registerMaintenance', message: 'TYPE_REQUIRED' });
		}

		if (!description || typeof description !== 'string') {
			return fail(400, { action: 'registerMaintenance', message: 'DESCRIPTION_REQUIRED' });
		}

		if (!startDate || typeof startDate !== 'string') {
			return fail(400, { action: 'registerMaintenance', message: 'START_DATE_REQUIRED' });
		}

		const maintenanceId = generateUniqueId();
		const now = new Date();

		const maintenanceData: typeof schema.equipmentMaintenance.$inferInsert = {
			id: maintenanceId,
			equipmentId: params.id,
			type,
			description,
			provider: provider ? String(provider) : null,
			cost: cost ? parseInt(String(cost)) : null,
			startDate: new Date(startDate),
			endDate: endDate ? new Date(String(endDate)) : null,
			status: String(status),
			nextMaintenanceDate: nextMaintenanceDate ? new Date(String(nextMaintenanceDate)) : null,
			notes: notes ? String(notes) : null,
			registeredById: locals.user.id,
			createdAt: now,
			updatedAt: null
		};

		await db.insert(schema.equipmentMaintenance).values(maintenanceData);

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
	}
};
