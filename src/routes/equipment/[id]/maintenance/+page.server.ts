import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq } from 'drizzle-orm';

const maintenanceTypes = ['preventiva', 'corretiva', 'calibracao'] as const;
const allowedTypes = new Set(maintenanceTypes);
type MaintenanceType = (typeof maintenanceTypes)[number];

const equipmentStatuses = ['ativo', 'em_manutencao', 'inativo'] as const;
type EquipmentStatus = (typeof equipmentStatuses)[number];

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
			status: schema.equipment.status
		})
		.from(schema.equipment)
		.where(eq(schema.equipment.id, equipmentId))
		.limit(1);

	if (equipment.length === 0) {
		throw redirect(302, '/equipment');
	}

	const maintenanceHistory = await db
		.select({
			id: schema.equipmentMaintenance.id,
			type: schema.equipmentMaintenance.type,
			status: schema.equipmentMaintenance.status,
			scheduledFor: schema.equipmentMaintenance.scheduledFor,
			startedAt: schema.equipmentMaintenance.startedAt,
			completedAt: schema.equipmentMaintenance.completedAt,
			resultNote: schema.equipmentMaintenance.resultNote,
			technicianUserId: schema.equipmentMaintenance.technicianUserId
		})
		.from(schema.equipmentMaintenance)
		.where(eq(schema.equipmentMaintenance.equipmentId, equipmentId))
		.orderBy(schema.equipmentMaintenance.createdAt);

	return {
		equipment: equipment[0],
		maintenanceHistory
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals, request, params } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await request.formData();
		const type = formData.get('type');
		const scheduledFor = formData.get('scheduledFor');
		const startedAt = formData.get('startedAt');
		const completedAt = formData.get('completedAt');
		const technicianUserId = formData.get('technicianUserId');
		const resultNote = formData.get('resultNote');
		const status = formData.get('status') ?? 'em_manutencao';

		if (!type || typeof type !== 'string' || !allowedTypes.has(type as MaintenanceType)) {
			return fail(400, { message: 'INVALID_MAINTENANCE_TYPE' });
		}

		const maintenanceId = crypto.randomUUID();
		const normalizedType: MaintenanceType =
			typeof type === 'string' && allowedTypes.has(type as MaintenanceType)
				? (type as MaintenanceType)
				: 'preventiva';
		const normalizedStatus: EquipmentStatus =
			typeof status === 'string' && equipmentStatuses.includes(status as EquipmentStatus)
				? (status as EquipmentStatus)
				: 'em_manutencao';

		await db.insert(schema.equipmentMaintenance).values([
			{
				id: maintenanceId,
				equipmentId: params.id,
				type: normalizedType,
				status: normalizedStatus,
				scheduledFor:
					typeof scheduledFor === 'string' && scheduledFor !== ''
						? new Date(scheduledFor).toISOString()
						: null,
				startedAt:
					typeof startedAt === 'string' && startedAt !== ''
						? new Date(startedAt).toISOString()
						: null,
				completedAt:
					typeof completedAt === 'string' && completedAt !== ''
						? new Date(completedAt).toISOString()
						: null,
				technicianUserId:
					typeof technicianUserId === 'string' && technicianUserId.trim() !== ''
						? technicianUserId
						: null,
				resultNote:
					typeof resultNote === 'string' && resultNote.trim() !== '' ? resultNote.trim() : null
			}
		]);

		await db.insert(schema.equipmentAuditLog).values({
			id: crypto.randomUUID(),
			equipmentId: params.id,
			eventType: 'manutencao',
			payload: {
				maintenanceId,
				type,
				status,
				userId: locals.user.id
			},
			actorUserId: locals.user.id
		});

		if (normalizedStatus === 'em_manutencao') {
			await db
				.update(schema.equipment)
				.set({
					status: normalizedStatus,
					updatedAt: new Date().toISOString()
				})
				.where(eq(schema.equipment.id, params.id));
		}

		throw redirect(303, `/equipment/${params.id}`);
	}
};
