import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/user/login');
	}

	const pending = await db
		.select({
			id: schema.equipmentMovement.id,
			equipmentId: schema.equipmentMovement.equipmentId,
			status: schema.equipmentMovement.status,
			requestedAt: schema.equipmentMovement.requestedAt,
			movementNote: schema.equipmentMovement.movementNote,
			authorizationNote: schema.equipmentMovement.authorizationNote,
			targetLocationId: schema.equipmentMovement.targetLocationId,
			targetLocationName: schema.location.name,
			equipmentName: schema.equipment.name,
			assetCode: schema.equipment.assetCode,
			requestedByUserId: schema.equipmentMovement.requestedByUserId
		})
		.from(schema.equipmentMovement)
		.innerJoin(schema.equipment, eq(schema.equipmentMovement.equipmentId, schema.equipment.id))
		.leftJoin(schema.location, eq(schema.equipmentMovement.targetLocationId, schema.location.id))
		.where(eq(schema.equipmentMovement.status, 'pendente'))
		.orderBy(schema.equipmentMovement.requestedAt);

	return { pending };
};

export const actions: Actions = {
	approve: async (event) => {
		const { locals, request } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await request.formData();
		const movementId = formData.get('movementId');
		const note = formData.get('note');

		if (!movementId || typeof movementId !== 'string') {
			return fail(400, { message: 'MOVEMENT_ID_REQUIRED' });
		}

		const movement = await db
			.select({
				id: schema.equipmentMovement.id,
				equipmentId: schema.equipmentMovement.equipmentId,
				targetLocationId: schema.equipmentMovement.targetLocationId,
				originLocationId: schema.equipmentMovement.originLocationId
			})
			.from(schema.equipmentMovement)
			.where(eq(schema.equipmentMovement.id, movementId))
			.limit(1);

		if (movement.length === 0) {
			return fail(404, { message: 'MOVEMENT_NOT_FOUND' });
		}

		await db
			.update(schema.equipmentMovement)
			.set({
				status: 'aprovado',
				authorizationNote:
					typeof note === 'string' && note.trim() !== '' ? note : schema.equipmentMovement.authorizationNote,
				authorizedByUserId: locals.user.id,
				authorizedAt: new Date().toISOString()
			})
			.where(eq(schema.equipmentMovement.id, movementId));

		await db
			.update(schema.equipment)
			.set({
				locationId: movement[0].targetLocationId,
				updatedAt: new Date().toISOString()
			})
			.where(eq(schema.equipment.id, movement[0].equipmentId));

		await db.insert(schema.equipmentAuditLog).values({
			id: crypto.randomUUID(),
			equipmentId: movement[0].equipmentId,
			eventType: 'movimento',
			payload: {
				movementId,
				action: 'aprovado',
				targetLocationId: movement[0].targetLocationId,
				userId: locals.user.id
			},
			actorUserId: locals.user.id
		});

		throw redirect(303, '/equipment/approvals');
	},
	reject: async (event) => {
		const { locals, request } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await request.formData();
		const movementId = formData.get('movementId');
		const note = formData.get('note');

		if (!movementId || typeof movementId !== 'string') {
			return fail(400, { message: 'MOVEMENT_ID_REQUIRED' });
		}

		await db
			.update(schema.equipmentMovement)
			.set({
				status: 'rejeitado',
				authorizationNote:
					typeof note === 'string' && note.trim() !== '' ? note : schema.equipmentMovement.authorizationNote,
				authorizedByUserId: locals.user.id,
				authorizedAt: new Date().toISOString()
			})
			.where(eq(schema.equipmentMovement.id, movementId));

		const movement = await db
			.select({
				equipmentId: schema.equipmentMovement.equipmentId
			})
			.from(schema.equipmentMovement)
			.where(eq(schema.equipmentMovement.id, movementId))
			.limit(1);

		if (movement.length > 0) {
			await db.insert(schema.equipmentAuditLog).values({
				id: crypto.randomUUID(),
				equipmentId: movement[0].equipmentId,
				eventType: 'movimento',
				payload: {
					movementId,
					action: 'rejeitado',
					userId: locals.user.id
				},
				actorUserId: locals.user.id
			});
		}

		throw redirect(303, '/equipment/approvals');
	}
};
