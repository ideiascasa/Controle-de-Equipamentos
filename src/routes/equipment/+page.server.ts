import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { listEquipment } from './utils.server';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async () => {
	requireLogin();

	const equipment = await listEquipment(db);

	return {
		equipment
	};
};
