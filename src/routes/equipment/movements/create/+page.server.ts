import { redirect, fail } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and, isNull, or, sql } from 'drizzle-orm';
import { getUserGroupsAndAdmin } from '$lib/utils/common';
import { createMovement } from '../../utils.server';

export const load: PageServerLoad = async () => {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		redirect(302, '/user/login');
	}

	// Get available equipment
	const userGroups = await getUserGroupsAndAdmin(db, locals.user.id);
	const isAdmin = userGroups.some((g) => g.isAdmin === true);
	const userGroupIds = userGroups.map((g) => g.groupId);

	let whereConditions = [
		isNull(schema.equipment.deletedAt),
		or(
			eq(schema.equipment.status, 'available'),
			eq(schema.equipment.status, 'allocated'),
			eq(schema.equipment.currentUserId, locals.user.id)
		)
	];

	if (!isAdmin && userGroupIds.length > 0) {
		whereConditions.push(
			or(
				sql`${schema.equipment.groupId} = ANY(${userGroupIds})`,
				isNull(schema.equipment.groupId)
			)
		);
	} else if (!isAdmin) {
		whereConditions.push(isNull(schema.equipment.groupId));
	}

	const equipment = await db
		.select({
			id: schema.equipment.id,
			name: schema.equipment.name,
			status: schema.equipment.status,
			currentLocation: schema.equipment.currentLocation
		})
		.from(schema.equipment)
		.where(and(...whereConditions))
		.orderBy(schema.equipment.name);

	return {
		equipment
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals } = event;

		if (!locals.user) {
			return fail(401, { action: 'create', message: 'UNAUTHORIZED' });
		}

		const formData = await event.request.formData();
		const data = {
			equipmentId: formData.get('equipmentId')?.toString() || '',
			toLocation: formData.get('toLocation')?.toString() || '',
			fromLocation: formData.get('fromLocation')?.toString(),
			toUserId: formData.get('toUserId')?.toString(),
			notes: formData.get('notes')?.toString()
		};

		const result = await createMovement(db, data, locals.user.id);

		if (!result.success) {
			return fail(400, { action: 'create', message: result.error });
		}

		redirect(303, `/equipment/movements`);
	}
};
