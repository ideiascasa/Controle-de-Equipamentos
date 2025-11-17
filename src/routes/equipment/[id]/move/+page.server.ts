import { redirect, error, fail } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { generateUniqueId } from '$lib/utils/common';
import { createAuditLog } from '$lib/utils/audit';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async ({ params }) => {
	const result = requireLogin();

	const menu: MenuData = [
		{ label: 'Equipamentos', href: '/equipment' },
		{ label: 'Detalhes', href: `/equipment/${params.id}` },
		{ label: 'Mover', href: `/equipment/${params.id}/move` }
	];

	// Fetch equipment
	const equipment = await db
		.select()
		.from(schema.equipment)
		.where(and(eq(schema.equipment.id, params.id), isNull(schema.equipment.deletedAt)))
		.limit(1);

	if (equipment.length === 0) {
		throw error(404, 'Equipamento nao encontrado');
	}

	// Fetch all locations
	const locations = await db
		.select()
		.from(schema.location)
		.where(eq(schema.location.isActive, true))
		.orderBy(schema.location.name);

	// Fetch all users
	const users = await db
		.select({
			id: schema.user.id,
			name: schema.user.name,
			username: schema.user.username
		})
		.from(schema.user)
		.orderBy(schema.user.name);

	return {
		...result,
		menu,
		equipment: equipment[0],
		locations,
		users
	};
};

export const actions: Actions = {
	requestMovement: async (event) => {
		const { locals } = event;

		if (!locals.user) {
			return fail(401, { action: 'requestMovement', message: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const equipmentId = formData.get('equipmentId');
		const toLocationId = formData.get('toLocationId');
		const toUserId = formData.get('toUserId');
		const reason = formData.get('reason');
		const notes = formData.get('notes');

		// Validate inputs
		if (!equipmentId || typeof equipmentId !== 'string') {
			return fail(400, { action: 'requestMovement', message: 'EQUIPMENT_ID_REQUIRED' });
		}

		if (!toLocationId || typeof toLocationId !== 'string') {
			return fail(400, { action: 'requestMovement', message: 'TO_LOCATION_REQUIRED' });
		}

		// Verify equipment exists
		const equipment = await db
			.select()
			.from(schema.equipment)
			.where(and(eq(schema.equipment.id, equipmentId), isNull(schema.equipment.deletedAt)))
			.limit(1);

		if (equipment.length === 0) {
			return fail(404, { action: 'requestMovement', message: 'EQUIPMENT_NOT_FOUND' });
		}

		// Verify location exists
		const location = await db
			.select()
			.from(schema.location)
			.where(eq(schema.location.id, toLocationId))
			.limit(1);

		if (location.length === 0) {
			return fail(400, { action: 'requestMovement', message: 'LOCATION_NOT_FOUND' });
		}

		// Verify user if provided
		if (toUserId && typeof toUserId === 'string') {
			const user = await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.id, toUserId))
				.limit(1);

			if (user.length === 0) {
				return fail(400, { action: 'requestMovement', message: 'USER_NOT_FOUND' });
			}
		}

		const equipmentData = equipment[0];
		const now = new Date();

		// Create movement record
		const movementId = generateUniqueId();
		await db.insert(schema.equipmentMovement).values({
			id: movementId,
			equipmentId,
			fromLocationId: equipmentData.currentLocationId,
			toLocationId,
			fromUserId: equipmentData.currentUserId,
			toUserId: toUserId && typeof toUserId === 'string' ? toUserId : null,
			requestedById: locals.user.id,
			status: 'pending',
			reason: reason && typeof reason === 'string' ? reason.trim() : null,
			notes: notes && typeof notes === 'string' ? notes.trim() : null,
			requestedAt: now
		});

		// For now, auto-approve and complete the movement
		// In a full implementation, this would require admin approval
		await db
			.update(schema.equipmentMovement)
			.set({
				status: 'approved',
				authorizedById: locals.user.id,
				authorizedAt: now
			})
			.where(eq(schema.equipmentMovement.id, movementId));

		// Update equipment location and user
		await db
			.update(schema.equipment)
			.set({
				currentLocationId: toLocationId,
				currentUserId: toUserId && typeof toUserId === 'string' ? toUserId : null,
				updatedAt: now,
				updatedById: locals.user.id
			})
			.where(eq(schema.equipment.id, equipmentId));

		// Complete the movement
		await db
			.update(schema.equipmentMovement)
			.set({
				status: 'completed',
				completedAt: now
			})
			.where(eq(schema.equipmentMovement.id, movementId));

		// Audit logs
		await createAuditLog(db, 'equipment.movement.requested', locals.user.id, {
			movementId,
			equipmentId,
			toLocationId
		});

		await createAuditLog(db, 'equipment.movement.approved', locals.user.id, {
			movementId,
			equipmentId
		});

		await createAuditLog(db, 'equipment.movement.completed', locals.user.id, {
			movementId,
			equipmentId
		});

		return redirect(303, `/equipment/${equipmentId}`);
	}
};
