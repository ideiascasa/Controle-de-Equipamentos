import { redirect, fail, error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad, Actions } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { createAuditLog } from '$lib/utils/audit';
import { generateUniqueId } from '$lib/utils/common';
import { m } from '$lib/paraglide/messages.js';

export const load: PageServerLoad = async ({ params }) => {
	const result = requireLogin();

	const menu: MenuData = [
		{
			trigger: 'Equipamentos',
			items: [
				{
					title: 'Listar Equipamentos',
					href: '/equipment',
					description: 'Visualizar todos os equipamentos cadastrados.'
				},
				{
					title: 'Criar Equipamento',
					href: '/equipment/create',
					description: 'Cadastrar um novo equipamento no sistema.'
				}
			]
		}
	];

	const equipmentId = params.id;

	try {
		const equipment = await db
			.select()
			.from(schema.equipment)
			.where(and(eq(schema.equipment.id, equipmentId), isNull(schema.equipment.deletedAt)))
			.limit(1);

		if (equipment.length === 0) {
			throw error(404, 'Equipment not found');
		}

		const eq = equipment[0];

		// Fetch related data
		let currentLocation = null;
		let currentUser = null;

		if (eq.currentLocationId) {
			const location = await db
				.select()
				.from(schema.location)
				.where(and(eq(schema.location.id, eq.currentLocationId), isNull(schema.location.deletedAt)))
				.limit(1);
			if (location.length > 0) {
				currentLocation = location[0];
			}
		}

		if (eq.currentUserId) {
			const user = await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.id, eq.currentUserId))
				.limit(1);
			if (user.length > 0) {
				currentUser = user[0];
			}
		}

		// Fetch movement history
		const movements = await db
			.select({
				id: schema.equipmentMovement.id,
				fromLocationId: schema.equipmentMovement.fromLocationId,
				fromUserId: schema.equipmentMovement.fromUserId,
				toLocationId: schema.equipmentMovement.toLocationId,
				toUserId: schema.equipmentMovement.toUserId,
				movedById: schema.equipmentMovement.movedById,
				authorizedById: schema.equipmentMovement.authorizedById,
				reason: schema.equipmentMovement.reason,
				notes: schema.equipmentMovement.notes,
				createdAt: schema.equipmentMovement.createdAt
			})
			.from(schema.equipmentMovement)
			.where(eq(schema.equipmentMovement.equipmentId, equipmentId))
			.orderBy(desc(schema.equipmentMovement.createdAt))
			.limit(50);

		// Fetch maintenance history
		const maintenances = await db
			.select()
			.from(schema.equipmentMaintenance)
			.where(eq(schema.equipmentMaintenance.equipmentId, equipmentId))
			.orderBy(desc(schema.equipmentMaintenance.createdAt))
			.limit(50);

		// Fetch all locations and users for movement form
		const locations = await db
			.select({
				id: schema.location.id,
				name: schema.location.name
			})
			.from(schema.location)
			.where(isNull(schema.location.deletedAt));

		const users = await db.select({
			id: schema.user.id,
			username: schema.user.username,
			name: schema.user.name
		}).from(schema.user);

		const isAdministrator = result.groups?.some((group) => group.isAdmin === true) ?? false;

		return {
			...result,
			menu,
			equipment: eq,
			currentLocation,
			currentUser,
			movements,
			maintenances,
			locations,
			users,
			isAdministrator
		};
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Error loading equipment');
	}
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

		const formData = await event.request.formData();
		const toLocationId = formData.get('toLocationId');
		const toUserId = formData.get('toUserId');
		const reason = formData.get('reason');
		const notes = formData.get('notes');
		const authorizedById = formData.get('authorizedById');

		const equipmentId = params.id;

		try {
			// Verify equipment exists
			const equipment = await db
				.select()
				.from(schema.equipment)
				.where(and(eq(schema.equipment.id, equipmentId), isNull(schema.equipment.deletedAt)))
				.limit(1);

			if (equipment.length === 0) {
				return fail(404, { action: 'moveEquipment', message: 'EQUIPMENT_NOT_FOUND' });
			}

			const eq = equipment[0];

			// Validate at least one destination is provided
			if ((!toLocationId || typeof toLocationId !== 'string' || toLocationId.trim() === '') &&
				(!toUserId || typeof toUserId !== 'string' || toUserId.trim() === '')) {
				return fail(400, { action: 'moveEquipment', message: 'DESTINATION_REQUIRED' });
			}

			// Validate location if provided
			if (toLocationId && typeof toLocationId === 'string' && toLocationId.trim() !== '') {
				const location = await db
					.select()
					.from(schema.location)
					.where(and(eq(schema.location.id, toLocationId), isNull(schema.location.deletedAt)))
					.limit(1);
				if (location.length === 0) {
					return fail(400, { action: 'moveEquipment', message: 'LOCATION_NOT_FOUND' });
				}
			}

			// Validate user if provided
			if (toUserId && typeof toUserId === 'string' && toUserId.trim() !== '') {
				const user = await db
					.select()
					.from(schema.user)
					.where(eq(schema.user.id, toUserId))
					.limit(1);
				if (user.length === 0) {
					return fail(400, { action: 'moveEquipment', message: 'USER_NOT_FOUND' });
				}
			}

			// Create movement record
			const movementId = generateUniqueId();
			await db.insert(schema.equipmentMovement).values({
				id: movementId,
				equipmentId,
				fromLocationId: eq.currentLocationId,
				fromUserId: eq.currentUserId,
				toLocationId: toLocationId && typeof toLocationId === 'string' ? toLocationId : null,
				toUserId: toUserId && typeof toUserId === 'string' ? toUserId : null,
				movedById: locals.user.id,
				authorizedById: authorizedById && typeof authorizedById === 'string' ? authorizedById : null,
				reason: reason && typeof reason === 'string' ? reason : null,
				notes: notes && typeof notes === 'string' ? notes : null
			});

			// Update equipment location/user
			await db
				.update(schema.equipment)
				.set({
					currentLocationId: toLocationId && typeof toLocationId === 'string' ? toLocationId : null,
					currentUserId: toUserId && typeof toUserId === 'string' ? toUserId : null,
					updatedAt: new Date()
				})
				.where(eq(schema.equipment.id, equipmentId));

			// Audit log
			await createAuditLog(db, 'equipment.move', locals.user.id, {
				equipmentId,
				equipmentName: eq.name,
				movementId
			});

			return {
				action: 'moveEquipment',
				success: true,
				message: 'EQUIPMENT_MOVED_SUCCESS'
			};
		} catch (error) {
			console.error('Error moving equipment:', error);
			return fail(500, { action: 'moveEquipment', message: 'DATABASE_ERROR' });
		}
	}
};
