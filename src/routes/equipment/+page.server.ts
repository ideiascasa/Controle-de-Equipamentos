import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq } from 'drizzle-orm';

type EquipmentListItem = {
	id: string;
	assetCode: string;
	name: string;
	status: string;
	category: string | null;
	criticality: string;
	locationId: string | null;
	locationName: string | null;
	custodianUserId: string | null;
	updatedAt: string | null;
};

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) {
		// Layout already handles redirect, this guard keeps type narrow
		const emptySummary = { total: 0, byStatus: {}, byCriticality: {} };
		const emptyFilters = {
			search: '',
			status: null as string | null,
			criticality: null as string | null,
			category: null as string | null,
			locationId: null as string | null
		};
		return {
			equipment: [],
			filters: emptyFilters,
			summary: emptySummary,
			movements: []
		};
	}

	const search = url.searchParams.get('q')?.trim() ?? '';
	const status = url.searchParams.get('status');
	const criticality = url.searchParams.get('criticality');
	const category = url.searchParams.get('category');
	const locationId = url.searchParams.get('locationId');

	const rows = await db
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
			updatedAt: schema.equipment.updatedAt
		})
		.from(schema.equipment)
		.leftJoin(schema.location, eq(schema.equipment.locationId, schema.location.id));

	const equipment = rows
		.filter((item) => {
			const matchesSearch =
				search === '' ||
				item.name.toLowerCase().includes(search.toLowerCase()) ||
				item.assetCode.toLowerCase().includes(search.toLowerCase());
			const matchesStatus = !status || item.status === status;
			const matchesCriticality = !criticality || item.criticality === criticality;
			const matchesCategory = !category || item.category === category;
			const matchesLocation = !locationId || item.locationId === locationId;
			return matchesSearch && matchesStatus && matchesCriticality && matchesCategory && matchesLocation;
		})
		.map<EquipmentListItem>((item) => ({
			...item,
			category: item.category ?? null,
			locationId: item.locationId ?? null,
			locationName: item.locationName ?? null,
			custodianUserId: item.custodianUserId ?? null,
			updatedAt: item.updatedAt ?? null
		}));

	const summary = equipment.reduce(
		(acc, item) => {
			acc.total += 1;
			acc.byStatus[item.status] = (acc.byStatus[item.status] ?? 0) + 1;
			acc.byCriticality[item.criticality] = (acc.byCriticality[item.criticality] ?? 0) + 1;
			return acc;
		},
		{ total: 0, byStatus: {} as Record<string, number>, byCriticality: {} as Record<string, number> }
	);

	const pendingMovements = await db
		.select({
			id: schema.equipmentMovement.id,
			equipmentId: schema.equipmentMovement.equipmentId,
			status: schema.equipmentMovement.status,
			requestedAt: schema.equipmentMovement.requestedAt,
			assetCode: schema.equipment.assetCode,
			equipmentName: schema.equipment.name,
			targetLocationId: schema.equipmentMovement.targetLocationId,
			targetLocationName: schema.location.name
		})
		.from(schema.equipmentMovement)
		.innerJoin(schema.equipment, eq(schema.equipmentMovement.equipmentId, schema.equipment.id))
		.leftJoin(schema.location, eq(schema.equipmentMovement.targetLocationId, schema.location.id))
		.where(eq(schema.equipmentMovement.status, 'pendente'));

	return {
		equipment,
		filters: {
			search,
			status,
			criticality,
			category,
			locationId
		},
		summary,
		movements: pendingMovements
	};
};
