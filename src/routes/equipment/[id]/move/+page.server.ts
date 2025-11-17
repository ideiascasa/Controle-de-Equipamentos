import { redirect, fail, error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { generateUniqueId } from '$lib/utils/common';
import { createAuditLog } from '$lib/utils/audit';
import { getEquipmentById, getActiveLocations } from '../../utils.server';

export const load: PageServerLoad = async ({ params }) => {
	const result = requireLogin();

	const equipment = await getEquipmentById(db, params.id);

	if (!equipment) {
		throw error(404, 'Equipment not found');
	}

	const locations = await getActiveLocations(db);

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
					title: 'Movimentar Equipamento',
					href: `/equipment/${params.id}/move`,
					description: 'Realizar movimentacao do equipamento.'
				}
			]
		}
	];

	return {
		...result,
		menu,
		equipment,
		locations
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
	moveEquipment: async (event) => {
		const { locals, params } = event;

		if (!locals.user) {
			return fail(401, { action: 'moveEquipment', message: 'UNAUTHORIZED' });
		}

		const equipment = await getEquipmentById(db, params.id);

		if (!equipment) {
			return fail(404, { action: 'moveEquipment', message: 'EQUIPMENT_NOT_FOUND' });
		}

		const formData = await event.request.formData();
		const toLocationId = formData.get('toLocationId');
		const toUserId = formData.get('toUserId');
		const reason = formData.get('reason');
		const notes = formData.get('notes');
		const requiresAuthorization = formData.get('requiresAuthorization') === 'true';

		if (!toLocationId && !toUserId) {
			return fail(400, { action: 'moveEquipment', message: 'DESTINATION_REQUIRED' });
		}

		const movementId = generateUniqueId();
		const now = new Date();

		const movementData: typeof schema.equipmentMovement.$inferInsert = {
			id: movementId,
			equipmentId: params.id,
			fromLocationId: equipment.equipment.currentLocationId,
			toLocationId: toLocationId ? String(toLocationId) : null,
			fromUserId: equipment.equipment.currentUserId,
			toUserId: toUserId ? String(toUserId) : null,
			requestedById: locals.user.id,
			authorizedById: null,
			status: requiresAuthorization ? 'pending' : 'completed',
			reason: reason ? String(reason) : null,
			notes: notes ? String(notes) : null,
			requestedAt: now,
			authorizedAt: null,
			completedAt: requiresAuthorization ? null : now,
			createdAt: now
		};

		await db.insert(schema.equipmentMovement).values(movementData);

		if (!requiresAuthorization) {
			// Update equipment location/user immediately
			await db
				.update(schema.equipment)
				.set({
					currentLocationId: toLocationId ? String(toLocationId) : equipment.equipment.currentLocationId,
					currentUserId: toUserId ? String(toUserId) : equipment.equipment.currentUserId,
					updatedAt: now,
					updatedById: locals.user.id
				})
				.where(eq(schema.equipment.id, params.id));

			await createAuditLog(db, 'equipment.movement.completed', locals.user.id, {
				movementId,
				equipmentId: params.id
			});
		} else {
			await createAuditLog(db, 'equipment.movement.requested', locals.user.id, {
				movementId,
				equipmentId: params.id
			});
		}

		return redirect(303, `/equipment/${params.id}`);
	}
};
