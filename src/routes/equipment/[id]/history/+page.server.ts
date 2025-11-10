import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/user/login');
	}

	const equipment = await db
		.select({
			id: schema.equipment.id,
			name: schema.equipment.name,
			assetCode: schema.equipment.assetCode
		})
		.from(schema.equipment)
		.where(eq(schema.equipment.id, params.id))
		.limit(1);

	if (equipment.length === 0) {
		throw redirect(302, '/equipment');
	}

	const events = await db
		.select({
			id: schema.equipmentAuditLog.id,
			eventType: schema.equipmentAuditLog.eventType,
			payload: schema.equipmentAuditLog.payload,
			actorUserId: schema.equipmentAuditLog.actorUserId,
			createdAt: schema.equipmentAuditLog.createdAt
		})
		.from(schema.equipmentAuditLog)
		.where(eq(schema.equipmentAuditLog.equipmentId, params.id))
		.orderBy(desc(schema.equipmentAuditLog.createdAt));

	return {
		equipment: equipment[0],
		events
	};
};
