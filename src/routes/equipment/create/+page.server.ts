import * as auth from '$lib/utils/auth';
import { redirect, fail } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateUniqueId } from '$lib/utils/common';
import { createAuditLog } from '$lib/utils/audit';

export const load: PageServerLoad = async () => {
	const result = requireLogin();

	const menu: MenuData = [
		{ label: 'Equipamentos', href: '/equipment' },
		{ label: 'Novo Equipamento', href: '/equipment/create' }
	];

	return {
		...result,
		menu
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
		const manufacturer = formData.get('manufacturer');
		const model = formData.get('model');
		const serialNumber = formData.get('serialNumber');
		const acquisitionDate = formData.get('acquisitionDate');
		const value = formData.get('value');
		const status = formData.get('status') || 'available';
		const currentLocation = formData.get('currentLocation');
		const notes = formData.get('notes');

		if (!code || typeof code !== 'string') {
			return fail(400, { action: 'createEquipment', message: 'CODE_REQUIRED' });
		}

		if (!name || typeof name !== 'string') {
			return fail(400, { action: 'createEquipment', message: 'NAME_REQUIRED' });
		}

		// Check if code already exists
		const existing = await db
			.select()
			.from(schema.equipment)
			.where(eq(schema.equipment.code, code))
			.limit(1);

		if (existing.length > 0) {
			return fail(400, { action: 'createEquipment', message: 'CODE_ALREADY_EXISTS' });
		}

		const equipmentId = generateUniqueId();
		const now = new Date();

		let parsedValue: number | null = null;
		if (value && typeof value === 'string' && value.trim() !== '') {
			const numValue = parseFloat(value) * 100; // Convert to cents
			if (!isNaN(numValue)) {
				parsedValue = Math.round(numValue);
			}
		}

		let parsedDate: Date | null = null;
		if (acquisitionDate && typeof acquisitionDate === 'string' && acquisitionDate.trim() !== '') {
			parsedDate = new Date(acquisitionDate);
			if (isNaN(parsedDate.getTime())) {
				parsedDate = null;
			}
		}

		await db.insert(schema.equipment).values({
			id: equipmentId,
			code: code.trim(),
			name: name.trim(),
			description: description && typeof description === 'string' ? description.trim() : null,
			category: category && typeof category === 'string' ? category.trim() : null,
			manufacturer: manufacturer && typeof manufacturer === 'string' ? manufacturer.trim() : null,
			model: model && typeof model === 'string' ? model.trim() : null,
			serialNumber:
				serialNumber && typeof serialNumber === 'string' ? serialNumber.trim() : null,
			acquisitionDate: parsedDate,
			value: parsedValue,
			status: status as string,
			currentLocation:
				currentLocation && typeof currentLocation === 'string'
					? currentLocation.trim()
					: null,
			notes: notes && typeof notes === 'string' ? notes.trim() : null,
			createdAt: now,
			createdById: locals.user.id
		});

		await createAuditLog(db, 'equipment.create', locals.user.id, {
			equipmentId,
			code,
			name
		});

		return redirect(303, `/equipment/${equipmentId}`);
	}
};
