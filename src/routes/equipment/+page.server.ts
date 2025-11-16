import * as auth from '$lib/utils/auth';
import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull, or, sql } from 'drizzle-orm';
import { getUserGroupsAndAdmin } from '$lib/utils/common';

export const load: PageServerLoad = async () => {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		redirect(302, '/user/login');
	}

	const userGroups = await getUserGroupsAndAdmin(db, locals.user.id);
	const isAdmin = userGroups.some((g) => g.isAdmin === true);
	const userGroupIds = userGroups.map((g) => g.groupId);

	// Build query conditions
	let whereConditions = [isNull(schema.equipment.deletedAt)];

	// Filter by groups if not admin
	if (!isAdmin) {
		if (userGroupIds.length > 0) {
			whereConditions.push(
				or(
					sql`${schema.equipment.groupId} = ANY(${userGroupIds})`,
					isNull(schema.equipment.groupId)
				)
			);
		} else {
			// User has no groups, only show equipment with no group
			whereConditions.push(isNull(schema.equipment.groupId));
		}
	}

	// Build query to get equipment visible to user
	const equipmentList = await db
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
		.where(and(...whereConditions))
		.orderBy(schema.equipment.createdAt);

	return {
		equipment: equipmentList,
		isAdmin,
		userGroups
	};
};
