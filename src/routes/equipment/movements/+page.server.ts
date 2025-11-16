import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { getUserGroupsAndAdmin } from '$lib/utils/common';

export const load: PageServerLoad = async () => {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		redirect(302, '/user/login');
	}

	const userGroups = await getUserGroupsAndAdmin(db, locals.user.id);
	const isAdmin = userGroups.some((g) => g.isAdmin === true);
	const userGroupIds = userGroups.map((g) => g.groupId);

	// Get movements visible to user
	let equipmentIds: string[] | null = null;

	if (!isAdmin && userGroupIds.length > 0) {
		// Get equipment IDs from user's groups
		const equipmentInGroups = await db
			.select({ id: schema.equipment.id })
			.from(schema.equipment)
			.where(
				and(
					isNull(schema.equipment.deletedAt),
					inArray(schema.equipment.groupId, userGroupIds)
				)
			);

		equipmentIds = equipmentInGroups.map((e) => e.id);
		if (equipmentIds.length === 0) {
			// No equipment in user's groups, return empty
			return { movements: [], isAdmin };
		}
	}

	let whereConditions = [isNull(schema.equipment.deletedAt)];
	if (equipmentIds && equipmentIds.length > 0) {
		whereConditions.push(inArray(schema.equipmentMovement.equipmentId, equipmentIds));
	}

	const movements = await db
		.select({
			id: schema.equipmentMovement.id,
			equipmentId: schema.equipmentMovement.equipmentId,
			equipmentName: schema.equipment.name,
			fromLocation: schema.equipmentMovement.fromLocation,
			toLocation: schema.equipmentMovement.toLocation,
			status: schema.equipmentMovement.status,
			requestedByName: schema.user.name,
			requestedByUsername: schema.user.username,
			approvedById: schema.equipmentMovement.approvedById,
			createdAt: schema.equipmentMovement.createdAt,
			approvedAt: schema.equipmentMovement.approvedAt
		})
		.from(schema.equipmentMovement)
		.innerJoin(schema.equipment, eq(schema.equipmentMovement.equipmentId, schema.equipment.id))
		.leftJoin(schema.user, eq(schema.equipmentMovement.requestedById, schema.user.id))
		.where(and(...whereConditions))
		.orderBy(schema.equipmentMovement.createdAt);

	// Get approved by user names
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
		movements: movementsWithApprovedBy,
		isAdmin
	};
};
