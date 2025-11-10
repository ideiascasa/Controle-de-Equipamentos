import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/user/login');
	}

	const equipmentId = params.id;

	const equipment = await db
		.select({
			id: schema.equipment.id,
			name: schema.equipment.name,
			assetCode: schema.equipment.assetCode,
			locationId: schema.equipment.locationId,
			locationName: schema.location.name,
			status: schema.equipment.status
		})
		.from(schema.equipment)
		.leftJoin(schema.location, eq(schema.equipment.locationId, schema.location.id))
		.where(eq(schema.equipment.id, equipmentId))
		.limit(1);

	if (equipment.length === 0) {
		throw redirect(302, '/equipment');
	}

	const locations = await db
		.select({
			id: schema.location.id,
			name: schema.location.name,
			type: schema.location.type,
			isActive: schema.location.isActive
		})
		.from(schema.location)
		.where(eq(schema.location.isActive, true))
		.orderBy(schema.location.name);

	const pendingMovements = await db
		.select({
			id: schema.equipmentMovement.id,
			status: schema.equipmentMovement.status,
			requestedAt: schema.equipmentMovement.requestedAt,
			targetLocationId: schema.equipmentMovement.targetLocationId,
			targetLocationName: schema.location.name
		})
		.from(schema.equipmentMovement)
		.leftJoin(schema.location, eq(schema.equipmentMovement.targetLocationId, schema.location.id))
		.where(and(eq(schema.equipmentMovement.equipmentId, equipmentId), eq(schema.equipmentMovement.status, 'pendente')))
		.orderBy(schema.equipmentMovement.requestedAt);

	return { equipment: equipment[0], locations, pendingMovements };
};

export const actions: Actions = {
	default: async (event) => {
		const { locals, request, params } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await request.formData();
		const targetLocationId = formData.get('targetLocationId');
		const note = formData.get('note');
		const authorizationNote = formData.get('authorizationNote');

		if (!targetLocationId || typeof targetLocationId !== 'string' || targetLocationId.trim() === '') {
			return fail(400, { message: 'TARGET_LOCATION_REQUIRED' });
		}

		const equipment = await db
			.select({
				id: schema.equipment.id,
				locationId: schema.equipment.locationId,
				name: schema.equipment.name,
				assetCode: schema.equipment.assetCode
			})
			.from(schema.equipment)
			.where(eq(schema.equipment.id, params.id))
			.limit(1);

		if (equipment.length === 0) {
			return fail(404, { message: 'EQUIPMENT_NOT_FOUND' });
		}

		if (equipment[0].locationId && equipment[0].locationId === targetLocationId) {
			return fail(400, { message: 'TARGET_EQ_CURRENT_LOCATION' });
		}

		const locationExists = await db
			.select({ id: schema.location.id })
			.from(schema.location)
			.where(eq(schema.location.id, targetLocationId))
			.limit(1);

		if (locationExists.length === 0) {
			return fail(400, { message: 'TARGET_LOCATION_NOT_FOUND' });
		}

		const movementId = crypto.randomUUID();

		await db.insert(schema.equipmentMovement).values({
			id: movementId,
			equipmentId: params.id,
			requestedByUserId: locals.user.id,
			originLocationId: equipment[0].locationId ?? null,
			targetLocationId,
			status: 'pendente',
			movementNote: typeof note === 'string' && note.trim() !== '' ? note : null,
			authorizationNote:
				typeof authorizationNote === 'string' && authorizationNote.trim() !== ''
					? authorizationNote
					: null,
			payload: {
				requestedBy: locals.user.id
			}
		});

		await db.insert(schema.equipmentAuditLog).values({
			id: crypto.randomUUID(),
			equipmentId: params.id,
			eventType: 'movimento',
			payload: {
				movementId,
				targetLocationId,
				userId: locals.user.id
			},
			actorUserId: locals.user.id
		});

		throw redirect(303, `/equipment/${params.id}`);
	},
	cancel: async (event) => {
		const { locals, request, params } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await request.formData();
		const movementId = formData.get('movementId');

		if (!movementId || typeof movementId !== 'string') {
			return fail(400, { message: 'MOVEMENT_ID_REQUIRED' });
		}

		await db
			.update(schema.equipmentMovement)
			.set({
				status: 'cancelado',
				updatedAt: new Date().toISOString()
			})
			.where(
				and(eq(schema.equipmentMovement.id, movementId), eq(schema.equipmentMovement.equipmentId, params.id))
			);

		await db.insert(schema.equipmentAuditLog).values({
			id: crypto.randomUUID(),
			equipmentId: params.id,
			eventType: 'movimento',
			payload: {
				movementId,
				action: 'cancelado',
				userId: locals.user.id
			},
			actorUserId: locals.user.id
		});

		throw redirect(303, `/equipment/${params.id}`);
	}
};
