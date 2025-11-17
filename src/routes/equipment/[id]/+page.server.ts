import { redirect, error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}

export const load: PageServerLoad = async ({ params }) => {
	const result = requireLogin();

	const menu: MenuData = [
		{ label: 'Equipamentos', href: '/equipment' },
		{ label: 'Detalhes', href: `/equipment/${params.id}` }
	];

	// Fetch equipment
	const equipment = await db
		.select()
		.from(schema.equipment)
		.where(and(eq(schema.equipment.id, params.id), isNull(schema.equipment.deletedAt)))
		.limit(1);

	if (equipment.length === 0) {
		throw error(404, 'Equipamento nao encontrado');
	}

	const equipmentData = equipment[0];

	// Fetch location if exists
	let location = null;
	if (equipmentData.currentLocationId) {
		const locationData = await db
			.select()
			.from(schema.location)
			.where(eq(schema.location.id, equipmentData.currentLocationId))
			.limit(1);
		location = locationData[0] || null;
	}

	// Fetch user if exists
	let user = null;
	if (equipmentData.currentUserId) {
		const userData = await db
			.select({
				id: schema.user.id,
				name: schema.user.name,
				username: schema.user.username
			})
			.from(schema.user)
			.where(eq(schema.user.id, equipmentData.currentUserId))
			.limit(1);
		user = userData[0] || null;
	}

	// Fetch createdBy if exists
	let createdBy = null;
	if (equipmentData.createdById) {
		const createdByData = await db
			.select({
				id: schema.user.id,
				name: schema.user.name,
				username: schema.user.username
			})
			.from(schema.user)
			.where(eq(schema.user.id, equipmentData.createdById))
			.limit(1);
		createdBy = createdByData[0] || null;
	}

	// Fetch movement history
	const movements = await db
		.select({
			movement: schema.equipmentMovement,
			fromLocation: {
				id: schema.location.id,
				name: schema.location.name
			},
			toLocation: {
				id: schema.location.id,
				name: schema.location.name
			},
			requestedBy: {
				id: schema.user.id,
				name: schema.user.name,
				username: schema.user.username
			},
			authorizedBy: {
				id: schema.user.id,
				name: schema.user.name,
				username: schema.user.username
			}
		})
		.from(schema.equipmentMovement)
		.leftJoin(schema.location, eq(schema.equipmentMovement.fromLocationId, schema.location.id))
		.leftJoin(schema.location, eq(schema.equipmentMovement.toLocationId, schema.location.id))
		.leftJoin(schema.user, eq(schema.equipmentMovement.requestedById, schema.user.id))
		.leftJoin(schema.user, eq(schema.equipmentMovement.authorizedById, schema.user.id))
		.where(eq(schema.equipmentMovement.equipmentId, params.id))
		.orderBy(schema.equipmentMovement.createdAt);

	// Fetch maintenance history
	const maintenances = await db
		.select({
			maintenance: schema.equipmentMaintenance,
			registeredBy: {
				id: schema.user.id,
				name: schema.user.name,
				username: schema.user.username
			},
			performedBy: {
				id: schema.user.id,
				name: schema.user.name,
				username: schema.user.username
			}
		})
		.from(schema.equipmentMaintenance)
		.leftJoin(schema.user, eq(schema.equipmentMaintenance.registeredById, schema.user.id))
		.leftJoin(schema.user, eq(schema.equipmentMaintenance.performedById, schema.user.id))
		.where(eq(schema.equipmentMaintenance.equipmentId, params.id))
		.orderBy(schema.equipmentMaintenance.createdAt);

	return {
		...result,
		menu,
		equipment: equipmentData,
		location,
		user,
		createdBy,
		movements,
		maintenances
	};
};
