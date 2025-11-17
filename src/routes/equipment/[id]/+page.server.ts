import * as auth from '$lib/utils/auth';
import { redirect, error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const result = requireLogin();

	const equipmentResult = await db
		.select({
			id: schema.equipment.id,
			code: schema.equipment.code,
			name: schema.equipment.name,
			description: schema.equipment.description,
			category: schema.equipment.category,
			manufacturer: schema.equipment.manufacturer,
			model: schema.equipment.model,
			serialNumber: schema.equipment.serialNumber,
			acquisitionDate: schema.equipment.acquisitionDate,
			value: schema.equipment.value,
			status: schema.equipment.status,
			currentLocation: schema.equipment.currentLocation,
			currentUserId: schema.equipment.currentUserId,
			notes: schema.equipment.notes,
			createdAt: schema.equipment.createdAt,
			createdById: schema.equipment.createdById
		})
		.from(schema.equipment)
		.where(and(eq(schema.equipment.id, params.id), isNull(schema.equipment.deletedAt)))
		.limit(1);

	if (equipmentResult.length === 0) {
		error(404, 'Equipamento nao encontrado');
	}

	const equipmentData = equipmentResult[0];

	// Get current user info
	let currentUserName: string | null = null;
	let currentUserUsername: string | null = null;
	if (equipmentData.currentUserId) {
		const currentUser = await db
			.select({ name: schema.user.name, username: schema.user.username })
			.from(schema.user)
			.where(eq(schema.user.id, equipmentData.currentUserId))
			.limit(1);
		if (currentUser.length > 0) {
			currentUserName = currentUser[0].name;
			currentUserUsername = currentUser[0].username;
		}
	}

	// Get creator info
	let createdByName: string | null = null;
	let createdByUsername: string | null = null;
	if (equipmentData.createdById) {
		const creator = await db
			.select({ name: schema.user.name, username: schema.user.username })
			.from(schema.user)
			.where(eq(schema.user.id, equipmentData.createdById))
			.limit(1);
		if (creator.length > 0) {
			createdByName = creator[0].name;
			createdByUsername = creator[0].username;
		}
	}

	const equipment = {
		...equipmentData,
		currentUserName,
		currentUserUsername,
		createdByName,
		createdByUsername
	};


	// Get movements
	const movementsResult = await db
		.select({
			id: schema.equipmentMovement.id,
			fromLocation: schema.equipmentMovement.fromLocation,
			toLocation: schema.equipmentMovement.toLocation,
			status: schema.equipmentMovement.status,
			requestDate: schema.equipmentMovement.requestDate,
			authorizationDate: schema.equipmentMovement.authorizationDate,
			completionDate: schema.equipmentMovement.completionDate,
			requestedById: schema.equipmentMovement.requestedById,
			authorizedById: schema.equipmentMovement.authorizedById
		})
		.from(schema.equipmentMovement)
		.where(eq(schema.equipmentMovement.equipmentId, params.id))
		.orderBy(desc(schema.equipmentMovement.requestDate))
		.limit(50);

	// Get user info for movements
	const movements = await Promise.all(
		movementsResult.map(async (movement) => {
			let requestedByName: string | null = null;
			let requestedByUsername: string | null = null;
			if (movement.requestedById) {
				const requester = await db
					.select({ name: schema.user.name, username: schema.user.username })
					.from(schema.user)
					.where(eq(schema.user.id, movement.requestedById))
					.limit(1);
				if (requester.length > 0) {
					requestedByName = requester[0].name;
					requestedByUsername = requester[0].username;
				}
			}

			let authorizedByName: string | null = null;
			let authorizedByUsername: string | null = null;
			if (movement.authorizedById) {
				const authorizer = await db
					.select({ name: schema.user.name, username: schema.user.username })
					.from(schema.user)
					.where(eq(schema.user.id, movement.authorizedById))
					.limit(1);
				if (authorizer.length > 0) {
					authorizedByName = authorizer[0].name;
					authorizedByUsername = authorizer[0].username;
				}
			}

			return {
				...movement,
				requestedByName,
				requestedByUsername,
				authorizedByName,
				authorizedByUsername
			};
		})
	);

	// Get maintenance records
	const maintenances = await db
		.select({
			id: schema.equipmentMaintenance.id,
			type: schema.equipmentMaintenance.type,
			description: schema.equipmentMaintenance.description,
			scheduledDate: schema.equipmentMaintenance.scheduledDate,
			completedDate: schema.equipmentMaintenance.completedDate,
			status: schema.equipmentMaintenance.status,
			cost: schema.equipmentMaintenance.cost,
			provider: schema.equipmentMaintenance.provider,
			technician: schema.equipmentMaintenance.technician,
			createdAt: schema.equipmentMaintenance.createdAt
		})
		.from(schema.equipmentMaintenance)
		.where(eq(schema.equipmentMaintenance.equipmentId, params.id))
		.orderBy(desc(schema.equipmentMaintenance.createdAt))
		.limit(50);

	const menu: MenuData = [
		{ label: 'Equipamentos', href: '/equipment' },
		{ label: equipmentData.name, href: `/equipment/${params.id}` }
	];

	return {
		...result,
		menu,
		equipment: equipmentData,
		movements,
		maintenances
	};
};

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}
