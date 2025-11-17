import { redirect, fail } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateUniqueId } from '$lib/utils/common';
import { createAuditLog } from '$lib/utils/audit';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async () => {
	const result = requireLogin();

	const menu: MenuData = [
		{ label: 'Equipamentos', href: '/equipment' },
		{ label: 'Novo', href: '/equipment/new' }
	];

	// Fetch all locations for selection
	const locations = await db
		.select()
		.from(schema.location)
		.where(eq(schema.location.isActive, true))
		.orderBy(schema.location.name);

	// Fetch all users for selection
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
		locations,
		users
	};
};

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
		const patrimonyNumber = formData.get('patrimonyNumber');
		const purchaseDate = formData.get('purchaseDate');
		const purchaseValue = formData.get('purchaseValue');
		const supplier = formData.get('supplier');
		const warrantyExpiry = formData.get('warrantyExpiry');
		const currentLocationId = formData.get('currentLocationId');
		const currentUserId = formData.get('currentUserId');
		const notes = formData.get('notes');

		// Validate required fields
		if (!code || typeof code !== 'string' || code.trim() === '') {
			return fail(400, { action: 'createEquipment', message: 'CODE_REQUIRED' });
		}

		if (!name || typeof name !== 'string' || name.trim() === '') {
			return fail(400, { action: 'createEquipment', message: 'NAME_REQUIRED' });
		}

		// Check if code already exists
		const existing = await db
			.select()
			.from(schema.equipment)
			.where(eq(schema.equipment.code, code.trim()))
			.limit(1);

		if (existing.length > 0) {
			return fail(400, { action: 'createEquipment', message: 'CODE_ALREADY_EXISTS' });
		}

		// Validate location if provided
		if (currentLocationId && typeof currentLocationId === 'string') {
			const location = await db
				.select()
				.from(schema.location)
				.where(eq(schema.location.id, currentLocationId))
				.limit(1);

			if (location.length === 0) {
				return fail(400, { action: 'createEquipment', message: 'LOCATION_NOT_FOUND' });
			}
		}

		// Validate user if provided
		if (currentUserId && typeof currentUserId === 'string') {
			const user = await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.id, currentUserId))
				.limit(1);

			if (user.length === 0) {
				return fail(400, { action: 'createEquipment', message: 'USER_NOT_FOUND' });
			}
		}

		// Parse dates
		const purchaseDateParsed = purchaseDate && typeof purchaseDate === 'string' && purchaseDate.trim() !== ''
			? new Date(purchaseDate)
			: null;

		const warrantyExpiryParsed = warrantyExpiry && typeof warrantyExpiry === 'string' && warrantyExpiry.trim() !== ''
			? new Date(warrantyExpiry)
			: null;

		// Create equipment
		const equipmentId = generateUniqueId();
		const now = new Date();

		await db.insert(schema.equipment).values({
			id: equipmentId,
			code: code.trim(),
			name: name.trim(),
			description: description && typeof description === 'string' ? description.trim() : null,
			category: category && typeof category === 'string' ? category.trim() : null,
			brand: brand && typeof brand === 'string' ? brand.trim() : null,
			model: model && typeof model === 'string' ? model.trim() : null,
			serialNumber: serialNumber && typeof serialNumber === 'string' ? serialNumber.trim() : null,
			patrimonyNumber: patrimonyNumber && typeof patrimonyNumber === 'string' ? patrimonyNumber.trim() : null,
			purchaseDate: purchaseDateParsed && !isNaN(purchaseDateParsed.getTime()) ? purchaseDateParsed : null,
			purchaseValue: purchaseValue && typeof purchaseValue === 'string' ? purchaseValue.trim() : null,
			supplier: supplier && typeof supplier === 'string' ? supplier.trim() : null,
			warrantyExpiry: warrantyExpiryParsed && !isNaN(warrantyExpiryParsed.getTime()) ? warrantyExpiryParsed : null,
			currentLocationId: currentLocationId && typeof currentLocationId === 'string' ? currentLocationId : null,
			currentUserId: currentUserId && typeof currentUserId === 'string' ? currentUserId : null,
			notes: notes && typeof notes === 'string' ? notes.trim() : null,
			createdAt: now,
			createdById: locals.user.id
		});

		// Audit log
		await createAuditLog(db, 'equipment.create', locals.user.id, {
			equipmentId,
			code: code.trim(),
			name: name.trim()
		});

		return redirect(303, `/equipment/${equipmentId}`);
	}
};
