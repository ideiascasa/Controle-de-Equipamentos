import * as auth from '$lib/utils/auth';
import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { getEquipmentList } from './utils.server';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		throw redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async () => {
	requireLogin();

	const equipment = await getEquipmentList(db);

	return {
		equipment
	};
};
