import { getRequestEvent } from '$app/server';
import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import { createEquipment, listLocations } from '../utils.server';
import { enhance } from '$app/forms';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async () => {
	const result = requireLogin();
	const locations = await listLocations(db);

	return {
		locations,
		userId: result.user?.id
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals } = event;

		if (!locals.user) {
			return fail(401, { error: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();
		const serialNumber = formData.get('serialNumber')?.toString();
		const model = formData.get('model')?.toString();
		const manufacturer = formData.get('manufacturer')?.toString();
		const category = formData.get('category')?.toString();
		const status = formData.get('status')?.toString() || 'available';
		const purchaseDateStr = formData.get('purchaseDate')?.toString();
		const purchaseValueStr = formData.get('purchaseValue')?.toString();
		const currentLocationId = formData.get('currentLocationId')?.toString();
		const currentUserId = formData.get('currentUserId')?.toString();

		const purchaseDate = purchaseDateStr ? new Date(purchaseDateStr) : null;
		const purchaseValue = purchaseValueStr ? parseInt(purchaseValueStr, 10) : null;

		const result = await createEquipment(
			db,
			{
				name: name || '',
				description: description || null,
				serialNumber: serialNumber || null,
				model: model || null,
				manufacturer: manufacturer || null,
				category: category || null,
				status,
				purchaseDate,
				purchaseValue,
				currentLocationId: currentLocationId || null,
				currentUserId: currentUserId || null
			},
			locals.user.id
		);

		if (!result.success) {
			return fail(400, { error: result.error });
		}

		return redirect(303, `/equipment/${result.equipment?.id}`);
	}
};
