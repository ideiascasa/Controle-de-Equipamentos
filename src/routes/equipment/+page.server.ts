import { redirect, fail } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad, Actions } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { createAuditLog } from '$lib/utils/audit';
import { generateUniqueId } from '$lib/utils/common';
import { m } from '$lib/paraglide/messages.js';

export const load: PageServerLoad = async ({ url }) => {
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

	// Check if user is administrator
	const isAdministrator = result.groups?.some((group) => group.isAdmin === true) ?? false;

	// Get filter parameters
	const statusFilter = url.searchParams.get('status');
	const categoryFilter = url.searchParams.get('category');
	const locationFilter = url.searchParams.get('location');

	// Build query conditions
	const conditions = [isNull(schema.equipment.deletedAt)];

	if (statusFilter) {
		conditions.push(eq(schema.equipment.status, statusFilter));
	}

	if (categoryFilter) {
		conditions.push(eq(schema.equipment.category, categoryFilter));
	}

	// Fetch equipment with related data
	let equipmentList: Array<{
		id: string;
		name: string;
		description: string | null;
		serialNumber: string | null;
		category: string | null;
		status: string;
		currentLocation: { id: string; name: string } | null;
		currentUser: { id: string; username: string; name: string | null } | null;
		createdAt: Date;
	}> = [];

	try {
		const equipment = await db
			.select({
				id: schema.equipment.id,
				name: schema.equipment.name,
				description: schema.equipment.description,
				serialNumber: schema.equipment.serialNumber,
				category: schema.equipment.category,
				status: schema.equipment.status,
				currentLocationId: schema.equipment.currentLocationId,
				currentUserId: schema.equipment.currentUserId,
				createdAt: schema.equipment.createdAt
			})
			.from(schema.equipment)
			.where(and(...conditions))
			.orderBy(desc(schema.equipment.createdAt))
			.limit(100);

		// Fetch related location and user data
		for (const eq of equipment) {
			let currentLocation = null;
			let currentUser = null;

			if (eq.currentLocationId) {
				const location = await db
					.select({
						id: schema.location.id,
						name: schema.location.name
					})
					.from(schema.location)
					.where(and(eq(schema.location.id, eq.currentLocationId), isNull(schema.location.deletedAt)))
					.limit(1);
				if (location.length > 0) {
					currentLocation = location[0];
				}
			}

			if (eq.currentUserId) {
				const user = await db
					.select({
						id: schema.user.id,
						username: schema.user.username,
						name: schema.user.name
					})
					.from(schema.user)
					.where(eq(schema.user.id, eq.currentUserId))
					.limit(1);
				if (user.length > 0) {
					currentUser = user[0];
				}
			}

			equipmentList.push({
				id: eq.id,
				name: eq.name,
				description: eq.description,
				serialNumber: eq.serialNumber,
				category: eq.category,
				status: eq.status,
				currentLocation,
				currentUser,
				createdAt: eq.createdAt
			});
		}
	} catch (error) {
		console.error('Error fetching equipment:', error);
		equipmentList = [];
	}

	// Fetch all locations for filter
	let locations: Array<{ id: string; name: string }> = [];
	try {
		const locationList = await db
			.select({
				id: schema.location.id,
				name: schema.location.name
			})
			.from(schema.location)
			.where(isNull(schema.location.deletedAt));
		locations = locationList;
	} catch (error) {
		console.error('Error fetching locations:', error);
	}

	return {
		...result,
		menu,
		isAdministrator,
		equipmentList,
		locations,
		statusFilter,
		categoryFilter,
		locationFilter
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
	deleteEquipment: async (event) => {
		const { locals } = event;

		if (!locals.user || !locals.groups) {
			return fail(401, { action: 'deleteEquipment', message: 'UNAUTHORIZED' });
		}

		const isAdministrator = locals.groups.some((group) => group.isAdmin === true);
		if (!isAdministrator) {
			return fail(403, { action: 'deleteEquipment', message: 'NOT_ADMINISTRATOR' });
		}

		const formData = await event.request.formData();
		const equipmentId = formData.get('equipmentId');

		if (!equipmentId || typeof equipmentId !== 'string') {
			return fail(400, { action: 'deleteEquipment', message: 'INVALID_EQUIPMENT_ID' });
		}

		try {
			// Verify equipment exists
			const equipment = await db
				.select()
				.from(schema.equipment)
				.where(and(eq(schema.equipment.id, equipmentId), isNull(schema.equipment.deletedAt)))
				.limit(1);

			if (equipment.length === 0) {
				return fail(404, { action: 'deleteEquipment', message: 'EQUIPMENT_NOT_FOUND' });
			}

			// Soft delete
			await db
				.update(schema.equipment)
				.set({
					deletedAt: new Date(),
					deletedById: locals.user.id
				})
				.where(eq(schema.equipment.id, equipmentId));

			// Audit log
			await createAuditLog(db, 'equipment.delete', locals.user.id, {
				equipmentId,
				equipmentName: equipment[0].name
			});

			return {
				action: 'deleteEquipment',
				success: true,
				message: 'EQUIPMENT_DELETED_SUCCESS'
			};
		} catch (error) {
			console.error('Error deleting equipment:', error);
			return fail(500, { action: 'deleteEquipment', message: 'DATABASE_ERROR' });
		}
	}
};
