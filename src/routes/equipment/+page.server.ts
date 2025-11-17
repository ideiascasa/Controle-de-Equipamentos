import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { getEquipmentList } from './utils.server';

export const load: PageServerLoad = async () => {
	const result = requireLogin();

	const equipmentList = await getEquipmentList(db);

	return {
		...result,
		equipmentList
	};
};

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const actions: Actions = {};
