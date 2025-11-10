import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { and, eq, ne } from 'drizzle-orm';

const allowedStatus = ['ativo', 'em_manutencao', 'inativo'] as const;
const allowedCriticality = ['baixa', 'media', 'alta'] as const;

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/user/login');
	}

	const equipmentId = params.id;

	const existing = await db
		.select({
			id: schema.equipment.id,
			assetCode: schema.equipment.assetCode,
			name: schema.equipment.name,
			status: schema.equipment.status,
			category: schema.equipment.category,
			criticality: schema.equipment.criticality,
			locationId: schema.equipment.locationId,
			custodianUserId: schema.equipment.custodianUserId,
			acquisitionDate: schema.equipment.acquisitionDate,
			depreciationEnd: schema.equipment.depreciationEnd,
			description: schema.equipment.description,
			metadata: schema.equipment.metadata
		})
		.from(schema.equipment)
		.where(eq(schema.equipment.id, equipmentId))
		.limit(1);

	if (existing.length === 0) {
		throw redirect(302, '/equipment');
	}

	const locations = await db
		.select({
			id: schema.location.id,
			name: schema.location.name,
			type: schema.location.type
		})
		.from(schema.location)
		.orderBy(schema.location.name);

	return {
		equipment: existing[0],
		locations
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals, request, params } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await request.formData();

		const assetCode = formData.get('assetCode');
		const name = formData.get('name');
		const status = formData.get('status') ?? 'ativo';
		const criticality = formData.get('criticality') ?? 'media';
		const category = formData.get('category');
		const locationId = formData.get('locationId');
		const custodianUserId = formData.get('custodianUserId');
		const acquisitionDate = formData.get('acquisitionDate');
		const depreciationEnd = formData.get('depreciationEnd');
		const description = formData.get('description');
		const metadataRaw = formData.get('metadata');

		if (!assetCode || typeof assetCode !== 'string' || assetCode.trim() === '') {
			return fail(400, { message: 'ASSET_CODE_REQUIRED' });
		}

		if (!name || typeof name !== 'string' || name.trim() === '') {
			return fail(400, { message: 'NAME_REQUIRED' });
		}

		const duplicate = await db
			.select({ id: schema.equipment.id })
			.from(schema.equipment)
			.where(and(eq(schema.equipment.assetCode, assetCode), ne(schema.equipment.id, params.id)))
			.limit(1);

		if (duplicate.length > 0) {
			return fail(400, { message: 'ASSET_CODE_ALREADY_EXISTS' });
		}

		let metadata: Record<string, unknown> | null = null;

		if (metadataRaw && typeof metadataRaw === 'string' && metadataRaw.trim() !== '') {
			try {
				metadata = JSON.parse(metadataRaw);
			} catch {
				return fail(400, { message: 'INVALID_METADATA_JSON' });
			}
		}

		const normalizedStatus =
			typeof status === 'string' && allowedStatus.includes(status as (typeof allowedStatus)[number])
				? (status as (typeof allowedStatus)[number])
				: 'ativo';

		const normalizedCriticality =
			typeof criticality === 'string' &&
			allowedCriticality.includes(criticality as (typeof allowedCriticality)[number])
				? (criticality as (typeof allowedCriticality)[number])
				: 'media';

		await db
			.update(schema.equipment)
			.set({
				assetCode,
				name,
				status: normalizedStatus,
				criticality: normalizedCriticality,
				category: typeof category === 'string' && category.trim() !== '' ? category : null,
				locationId:
					typeof locationId === 'string' && locationId.trim() !== '' ? (locationId as string) : null,
				custodianUserId:
					typeof custodianUserId === 'string' && custodianUserId.trim() !== ''
						? (custodianUserId as string)
						: null,
				acquisitionDate:
					typeof acquisitionDate === 'string' && acquisitionDate !== ''
						? new Date(acquisitionDate).toISOString()
						: null,
				depreciationEnd:
					typeof depreciationEnd === 'string' && depreciationEnd !== ''
						? new Date(depreciationEnd).toISOString()
						: null,
				description: typeof description === 'string' && description.trim() !== '' ? description : null,
				metadata,
				updatedAt: new Date().toISOString()
			})
			.where(eq(schema.equipment.id, params.id));

		await db.insert(schema.equipmentAuditLog).values({
			id: crypto.randomUUID(),
			equipmentId: params.id,
			eventType: 'edicao',
			payload: {
				assetCode,
				name,
				userId: locals.user.id
			},
			actorUserId: locals.user.id
		});

		throw redirect(303, `/equipment/${params.id}`);
	}
};
