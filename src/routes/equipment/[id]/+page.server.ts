import { redirect, error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { getUserGroupsAndAdmin } from '$lib/utils/common';

export const load: PageServerLoad = async ({ params }) => {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		redirect(302, '/user/login');
	}

	const userGroups = await getUserGroupsAndAdmin(db, locals.user.id);
	const isAdmin = userGroups.some((g) => g.isAdmin === true);
	const userGroupIds = userGroups.map((g) => g.groupId);

	// Get equipment
	const [equipment] = await db
		.select({
			id: schema.equipment.id,
			name: schema.equipment.name,
			description: schema.equipment.description,
			serialNumber: schema.equipment.serialNumber,
			category: schema.equipment.category,
			status: schema.equipment.status,
			currentLocation: schema.equipment.currentLocation,
			currentUserId: schema.equipment.currentUserId,
			currentUserName: schema.user.name,
			currentUserUsername: schema.user.username,
			groupId: schema.equipment.groupId,
			groupName: schema.group.name,
			imageUrl: schema.equipment.imageUrl,
			createdAt: schema.equipment.createdAt,
			createdById: schema.equipment.createdById
		})
		.from(schema.equipment)
		.leftJoin(schema.user, eq(schema.equipment.currentUserId, schema.user.id))
		.leftJoin(schema.group, eq(schema.equipment.groupId, schema.group.id))
		.where(and(eq(schema.equipment.id, params.id), isNull(schema.equipment.deletedAt)))
		.limit(1);

	if (!equipment) {
		error(404, 'Equipamento nao encontrado');
	}

	// Check permissions
	if (!isAdmin && equipment.groupId && !userGroupIds.includes(equipment.groupId)) {
		error(403, 'Acesso negado');
	}

	// Get location history
	const history = await db
		.select({
			id: schema.equipmentLocationHistory.id,
			location: schema.equipmentLocationHistory.location,
			action: schema.equipmentLocationHistory.action,
			notes: schema.equipmentLocationHistory.notes,
			createdAt: schema.equipmentLocationHistory.createdAt,
			performedByName: schema.user.name,
			performedByUsername: schema.user.username
		})
		.from(schema.equipmentLocationHistory)
		.leftJoin(schema.user, eq(schema.equipmentLocationHistory.performedById, schema.user.id))
		.where(eq(schema.equipmentLocationHistory.equipmentId, params.id))
		.orderBy(schema.equipmentLocationHistory.createdAt);

	// Get movements
	const movements = await db
		.select({
			id: schema.equipmentMovement.id,
			fromLocation: schema.equipmentMovement.fromLocation,
			toLocation: schema.equipmentMovement.toLocation,
			status: schema.equipmentMovement.status,
			requestedByName: schema.user.name,
			requestedByUsername: schema.user.username,
			approvedById: schema.equipmentMovement.approvedById,
			createdAt: schema.equipmentMovement.createdAt,
			approvedAt: schema.equipmentMovement.approvedAt,
			completedAt: schema.equipmentMovement.completedAt
		})
		.from(schema.equipmentMovement)
		.leftJoin(schema.user, eq(schema.equipmentMovement.requestedById, schema.user.id))
		.where(eq(schema.equipmentMovement.equipmentId, params.id))
		.orderBy(schema.equipmentMovement.createdAt);

	// Get approved by user names separately
	const approvedByUserIds = movements
		.map((m) => m.approvedById)
		.filter((id): id is string => id !== null);
	const approvedByUsers =
		approvedByUserIds.length > 0
			? await db
					.select({
						id: schema.user.id,
						name: schema.user.name,
						username: schema.user.username
					})
					.from(schema.user)
					.where(inArray(schema.user.id, approvedByUserIds))
			: [];

	const approvedByUsersMap = new Map(
		approvedByUsers.map((u) => [u.id, { name: u.name, username: u.username }])
	);

	const movementsWithApprovedBy = movements.map((m) => ({
		...m,
		approvedByName: m.approvedById ? approvedByUsersMap.get(m.approvedById)?.name : null,
		approvedByUsername: m.approvedById ? approvedByUsersMap.get(m.approvedById)?.username : null
	}));

	return {
		equipment,
		history,
		movements: movementsWithApprovedBy,
		isAdmin
	};
};
