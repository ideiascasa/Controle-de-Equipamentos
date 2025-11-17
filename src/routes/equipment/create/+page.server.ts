import { redirect, fail } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { generateUniqueId } from '$lib/utils/common';
import { createAuditLog } from '$lib/utils/audit';
import { getActiveLocations } from '../utils.server';

export const load: PageServerLoad = async () => {
	const result = requireLogin();

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
					title: 'Cadastrar Equipamento',
					href: '/equipment/create',
					description: 'Cadastrar um novo equipamento no sistema.'
				}
			]
		}
	];

	const locations = await getActiveLocations(db);

	return {
		...result,
		menu,
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
	createEquipment: async (event) => {
		const { locals } = event;

		if (!locals.user) {
			return fail(401, { action: 'createEquipment', message: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const code = formData.get('code');
		const name = formData.get('name');
		const description = formData.get('description');
		const category = formData.get('category');
		const brand = formData.get('brand');
		const model = formData.get('model');
		const serialNumber = formData.get('serialNumber');
		const status = formData.get('status') || 'available';
		const currentLocationId = formData.get('currentLocationId');
		const currentUserId = formData.get('currentUserId');
		const purchaseDate = formData.get('purchaseDate');
		const purchaseValue = formData.get('purchaseValue');
		const warrantyExpiry = formData.get('warrantyExpiry');

		if (!code || typeof code !== 'string') {
			return fail(400, { action: 'createEquipment', message: 'CODE_REQUIRED' });
		}

		if (!name || typeof name !== 'string') {
			return fail(400, { action: 'createEquipment', message: 'NAME_REQUIRED' });
		}

		// Check if code already exists
		const existingEquipment = await db
			.select()
			.from(schema.equipment)
			.where(and(eq(schema.equipment.code, code), isNull(schema.equipment.deletedAt)))
			.limit(1);

		if (existingEquipment.length > 0) {
			return fail(400, { action: 'createEquipment', message: 'CODE_ALREADY_EXISTS' });
		}

		const equipmentId = generateUniqueId();
		const now = new Date();

		const equipmentData: typeof schema.equipment.$inferInsert = {
			id: equipmentId,
			code,
			name,
			description: description ? String(description) : null,
			category: category ? String(category) : null,
			brand: brand ? String(brand) : null,
			model: model ? String(model) : null,
			serialNumber: serialNumber ? String(serialNumber) : null,
			status: String(status),
			currentLocationId: currentLocationId ? String(currentLocationId) : null,
			currentUserId: currentUserId ? String(currentUserId) : null,
			purchaseDate: purchaseDate ? new Date(String(purchaseDate)) : null,
			purchaseValue: purchaseValue ? parseInt(String(purchaseValue)) : null,
			warrantyExpiry: warrantyExpiry ? new Date(String(warrantyExpiry)) : null,
			createdAt: now,
			createdById: locals.user.id,
			updatedAt: null,
			updatedById: null,
			deletedAt: null,
			deletedById: null
		};

		await db.insert(schema.equipment).values(equipmentData);

		await createAuditLog(db, 'equipment.create', locals.user.id, {
			equipmentId,
			code,
			name
		});

		return redirect(303, `/equipment/${equipmentId}`);
	}
};
