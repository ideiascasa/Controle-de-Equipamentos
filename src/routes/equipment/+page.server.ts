import * as auth from '$lib/utils/auth';
import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull, or, like } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const result = requireLogin();

	const menu: MenuData = [
		{ label: 'Equipamentos', href: '/equipment' }
	];

	const search = url.searchParams.get('search') || '';
	const statusFilter = url.searchParams.get('status') || '';

	let query = db
		.select({
			id: schema.equipment.id,
			code: schema.equipment.code,
			name: schema.equipment.name,
			status: schema.equipment.status,
			currentLocation: schema.equipment.currentLocation,
			currentUserId: schema.equipment.currentUserId,
			currentUserName: schema.user.name,
			currentUserUsername: schema.user.username,
			createdAt: schema.equipment.createdAt
		})
		.from(schema.equipment)
		.leftJoin(schema.user, eq(schema.equipment.currentUserId, schema.user.id))
		.where(and(isNull(schema.equipment.deletedAt)));

	const conditions = [];

	if (search) {
		conditions.push(
			or(
				like(schema.equipment.name, `%${search}%`),
				like(schema.equipment.code, `%${search}%`),
				like(schema.equipment.description, `%${search}%`)
			)
		);
	}

	if (statusFilter) {
		conditions.push(eq(schema.equipment.status, statusFilter));
	}

	if (conditions.length > 0) {
		query = query.where(and(isNull(schema.equipment.deletedAt), ...conditions));
	}

	const equipment = await query.orderBy(schema.equipment.createdAt);

	return {
		...result,
		menu,
		equipment
	};
};

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}
