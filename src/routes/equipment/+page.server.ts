import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, or, like, isNull } from 'drizzle-orm';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async ({ url }) => {
	const result = requireLogin();

	const menu: MenuData = [
		{ label: 'Equipamentos', href: '/equipment' }
	];

	const search = url.searchParams.get('search') || '';
	const status = url.searchParams.get('status') || '';
	const locationId = url.searchParams.get('location') || '';

	// Build query conditions
	const conditions = [];
	
	if (search) {
		conditions.push(
			or(
				like(schema.equipment.name, `%${search}%`),
				like(schema.equipment.code, `%${search}%`),
				like(schema.equipment.serialNumber, `%${search}%`)
			)
		);
	}

	if (status) {
		conditions.push(eq(schema.equipment.status, status));
	}

	if (locationId) {
		conditions.push(eq(schema.equipment.currentLocationId, locationId));
	}

	// Only show non-deleted equipment
	conditions.push(isNull(schema.equipment.deletedAt));

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Fetch equipment with related data
	const equipmentList = await db
		.select({
			equipment: schema.equipment,
			location: {
				id: schema.location.id,
				name: schema.location.name
			},
			user: {
				id: schema.user.id,
				name: schema.user.name,
				username: schema.user.username
			}
		})
		.from(schema.equipment)
		.leftJoin(schema.location, eq(schema.equipment.currentLocationId, schema.location.id))
		.leftJoin(schema.user, eq(schema.equipment.currentUserId, schema.user.id))
		.where(whereClause)
		.orderBy(schema.equipment.createdAt);

	// Fetch all locations for filter
	const locations = await db
		.select()
		.from(schema.location)
		.where(eq(schema.location.isActive, true))
		.orderBy(schema.location.name);

	return {
		...result,
		menu,
		equipmentList,
		locations,
		search,
		status,
		locationId
	};
};
