import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { and, desc, eq, or, type SQL } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/user/login');
	}

	const equipmentId = params.id;

	const equipmentRecord = await db
		.select({
			id: schema.equipment.id,
			assetCode: schema.equipment.assetCode,
			name: schema.equipment.name,
			status: schema.equipment.status,
			category: schema.equipment.category,
			criticality: schema.equipment.criticality,
			locationId: schema.equipment.locationId,
			locationName: schema.location.name,
			custodianUserId: schema.equipment.custodianUserId,
			acquisitionDate: schema.equipment.acquisitionDate,
			depreciationEnd: schema.equipment.depreciationEnd,
			description: schema.equipment.description,
			metadata: schema.equipment.metadata,
			createdAt: schema.equipment.createdAt,
			updatedAt: schema.equipment.updatedAt
		})
		.from(schema.equipment)
		.leftJoin(schema.location, eq(schema.equipment.locationId, schema.location.id))
		.where(eq(schema.equipment.id, equipmentId))
		.limit(1);

	if (equipmentRecord.length === 0) {
		throw error(404, 'EQUIPMENT_NOT_FOUND');
	}

	const [record] = equipmentRecord;

	const movements = await db
		.select({
			id: schema.equipmentMovement.id,
			status: schema.equipmentMovement.status,
			requestedAt: schema.equipmentMovement.requestedAt,
			executedAt: schema.equipmentMovement.executedAt,
			originLocationId: schema.equipmentMovement.originLocationId,
			targetLocationId: schema.equipmentMovement.targetLocationId,
			authorizationNote: schema.equipmentMovement.authorizationNote,
			movementNote: schema.equipmentMovement.movementNote,
			requestedByUserId: schema.equipmentMovement.requestedByUserId,
			authorizedByUserId: schema.equipmentMovement.authorizedByUserId,
			targetLocationName: schema.location.name
		})
		.from(schema.equipmentMovement)
		.leftJoin(schema.location, eq(schema.equipmentMovement.targetLocationId, schema.location.id))
		.where(eq(schema.equipmentMovement.equipmentId, equipmentId))
		.orderBy(desc(schema.equipmentMovement.requestedAt));

	const maintenances = await db
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
		.orderBy(desc(schema.equipmentMaintenance.createdAt));

	const auditLog = await db
		.select({
			id: schema.equipmentAuditLog.id,
			eventType: schema.equipmentAuditLog.eventType,
			payload: schema.equipmentAuditLog.payload,
			actorUserId: schema.equipmentAuditLog.actorUserId,
			createdAt: schema.equipmentAuditLog.createdAt
		})
		.from(schema.equipmentAuditLog)
		.where(eq(schema.equipmentAuditLog.equipmentId, equipmentId))
		.orderBy(desc(schema.equipmentAuditLog.createdAt))
		.limit(50);

	const policyConditions: SQL[] = [eq(schema.movementPolicy.scope, 'role')];

	if (record.category) {
		const categoryCondition = and(
			eq(schema.movementPolicy.scope, 'category'),
			eq(schema.movementPolicy.category, record.category)
		);
		if (categoryCondition) {
			policyConditions.push(categoryCondition);
		}
	}

	if (record.locationId) {
		const locationCondition = and(
			eq(schema.movementPolicy.scope, 'location'),
			eq(schema.movementPolicy.locationId, record.locationId)
		);
		if (locationCondition) {
			policyConditions.push(locationCondition);
		}
	}

	const basePoliciesQuery = db
		.select({
			id: schema.movementPolicy.id,
			name: schema.movementPolicy.name,
			scope: schema.movementPolicy.scope,
			role: schema.movementPolicy.role,
			locationId: schema.movementPolicy.locationId,
			category: schema.movementPolicy.category,
			requiresApproval: schema.movementPolicy.requiresApproval
		})
		.from(schema.movementPolicy);

	const policies =
		policyConditions.length === 0
			? await basePoliciesQuery
			: policyConditions.length === 1
				? await basePoliciesQuery.where(policyConditions[0]!)
				: await basePoliciesQuery.where(or(...policyConditions));

	return {
		equipment: record,
		movements,
		maintenances,
		auditLog,
		policies
	};
};
