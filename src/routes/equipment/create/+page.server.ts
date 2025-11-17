import { redirect, fail } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad, Actions } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { createAuditLog } from '$lib/utils/audit';
import { generateUniqueId } from '$lib/utils/common';
import { m } from '$lib/paraglide/messages.js';

export const load: PageServerLoad = async () => {
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

	const isAdministrator = result.groups?.some((group) => group.isAdmin === true) ?? false;

	if (!isAdministrator) {
		return redirect(302, '/equipment');
	}

	// Fetch all locations for selection
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

	// Fetch all users for selection
	let users: Array<{ id: string; username: string; name: string | null }> = [];
	try {
		const userList = await db.select({
			id: schema.user.id,
			username: schema.user.username,
			name: schema.user.name
		}).from(schema.user);
		users = userList;
	} catch (error) {
		console.error('Error fetching users:', error);
	}

	return {
		...result,
		menu,
		isAdministrator,
		locations,
		users
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
	createEquipment: async (event) => {
		const { locals } = event;

		if (!locals.user || !locals.groups) {
			return fail(401, { action: 'createEquipment', message: 'UNAUTHORIZED' });
		}

		const isAdministrator = locals.groups.some((group) => group.isAdmin === true);
		if (!isAdministrator) {
			return fail(403, { action: 'createEquipment', message: 'NOT_ADMINISTRATOR' });
		}

		const formData = await event.request.formData();
		const name = formData.get('name');
		const description = formData.get('description');
		const serialNumber = formData.get('serialNumber');
		const category = formData.get('category');
		const status = formData.get('status') || 'available';
		const currentLocationId = formData.get('currentLocationId');
		const currentUserId = formData.get('currentUserId');

		// Validate required fields
		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return fail(400, { action: 'createEquipment', message: 'NAME_REQUIRED' });
		}

		// Check if serial number is unique (if provided)
		if (serialNumber && typeof serialNumber === 'string' && serialNumber.trim().length > 0) {
			try {
				const existing = await db
					.select()
					.from(schema.equipment)
					.where(eq(schema.equipment.serialNumber, serialNumber.trim()))
					.limit(1);
				if (existing.length > 0) {
					return fail(400, { action: 'createEquipment', message: 'SERIAL_NUMBER_EXISTS' });
				}
			} catch (error) {
				console.error('Error checking serial number:', error);
			}
		}

		// Validate location if provided
		if (currentLocationId && typeof currentLocationId === 'string') {
			try {
				const location = await db
					.select()
					.from(schema.location)
					.where(and(eq(schema.location.id, currentLocationId), isNull(schema.location.deletedAt)))
					.limit(1);
				if (location.length === 0) {
					return fail(400, { action: 'createEquipment', message: 'LOCATION_NOT_FOUND' });
				}
			} catch (error) {
				console.error('Error validating location:', error);
			}
		}

		// Validate user if provided
		if (currentUserId && typeof currentUserId === 'string') {
			try {
				const user = await db
					.select()
					.from(schema.user)
					.where(eq(schema.user.id, currentUserId))
					.limit(1);
				if (user.length === 0) {
					return fail(400, { action: 'createEquipment', message: 'USER_NOT_FOUND' });
				}
			} catch (error) {
				console.error('Error validating user:', error);
			}
		}

		try {
			const equipmentId = generateUniqueId();
			const equipment = {
				id: equipmentId,
				name: name.trim(),
				description: description && typeof description === 'string' ? description.trim() : null,
				serialNumber: serialNumber && typeof serialNumber === 'string' ? serialNumber.trim() : null,
				category: category && typeof category === 'string' ? category.trim() : null,
				status: typeof status === 'string' ? status : 'available',
				currentLocationId: currentLocationId && typeof currentLocationId === 'string' ? currentLocationId : null,
				currentUserId: currentUserId && typeof currentUserId === 'string' ? currentUserId : null,
				createdById: locals.user.id
			};

			await db.insert(schema.equipment).values(equipment);

			// Audit log
			await createAuditLog(db, 'equipment.create', locals.user.id, {
				equipmentId,
				equipmentName: equipment.name
			});

			return redirect(302, `/equipment/${equipmentId}`);
		} catch (error) {
			console.error('Error creating equipment:', error);
			return fail(500, { action: 'createEquipment', message: 'DATABASE_ERROR' });
		}
	}
};
