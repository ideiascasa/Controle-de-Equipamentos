import { fail, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { createAuditLog } from '$lib/utils/audit';
import { generateUniqueId } from '$lib/utils/common';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async () => {
	const result = requireLogin();

	try {
		const locations = await db
			.select({
				id: schema.location.id,
				name: schema.location.name
			})
			.from(schema.location)
			.where(isNull(schema.location.deletedAt));

		return {
			locations
		};
	} catch (error) {
		console.error('Error loading locations:', error);
		return {
			locations: []
		};
	}
};

export const actions: Actions = {
	default: async (event) => {
		const { locals } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const name = formData.get('name');
		const description = formData.get('description');
		const serialNumber = formData.get('serialNumber');
		const model = formData.get('model');
		const manufacturer = formData.get('manufacturer');
		const category = formData.get('category');
		const status = formData.get('status') || 'available';
		const currentLocationId = formData.get('currentLocationId');
		const purchaseDate = formData.get('purchaseDate');
		const purchaseValue = formData.get('purchaseValue');
		const warrantyExpiry = formData.get('warrantyExpiry');

		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return fail(400, { message: 'NAME_REQUIRED' });
		}

		try {
			// Check if serial number already exists
			if (serialNumber && typeof serialNumber === 'string' && serialNumber.trim().length > 0) {
				const existing = await db
					.select()
					.from(schema.equipment)
					.where(eq(schema.equipment.serialNumber, serialNumber.trim()))
					.limit(1);

				if (existing.length > 0) {
					return fail(400, { message: 'SERIAL_NUMBER_EXISTS' });
				}
			}

			const equipmentId = generateUniqueId();

			const equipmentData: any = {
				id: equipmentId,
				name: name.trim(),
				description: description && typeof description === 'string' ? description.trim() : null,
				serialNumber:
					serialNumber && typeof serialNumber === 'string' && serialNumber.trim().length > 0
						? serialNumber.trim()
						: null,
				model: model && typeof model === 'string' ? model.trim() : null,
				manufacturer: manufacturer && typeof manufacturer === 'string' ? manufacturer.trim() : null,
				category: category && typeof category === 'string' ? category.trim() : null,
				status: typeof status === 'string' ? status : 'available',
				currentLocationId:
					currentLocationId && typeof currentLocationId === 'string' && currentLocationId !== ''
						? currentLocationId
						: null,
				createdById: locals.user.id
			};

			if (purchaseDate && typeof purchaseDate === 'string') {
				equipmentData.purchaseDate = new Date(purchaseDate);
			}

			if (purchaseValue && typeof purchaseValue === 'string') {
				const value = parseInt(purchaseValue, 10);
				if (!isNaN(value)) {
					equipmentData.purchaseValue = Math.round(value * 100); // Convert to cents
				}
			}

			if (warrantyExpiry && typeof warrantyExpiry === 'string') {
				equipmentData.warrantyExpiry = new Date(warrantyExpiry);
			}

			await db.insert(schema.equipment).values(equipmentData);

			await createAuditLog(db, 'equipment.created', locals.user.id, {
				equipmentId,
				name: equipmentData.name
			});

			return redirect(303, `/equipment/${equipmentId}`);
		} catch (error) {
			console.error('Error creating equipment:', error);
			return fail(500, { message: 'DATABASE_ERROR' });
		}
	}
};
