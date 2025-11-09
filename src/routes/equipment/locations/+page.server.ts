import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq } from 'drizzle-orm';

const locationTypes = ['matriz', 'filial', 'sala', 'outro'] as const;
const allowedTypes = new Set(locationTypes);
type LocationType = (typeof locationTypes)[number];

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/user/login');
	}

	const locations = await db
		.select({
			id: schema.location.id,
			name: schema.location.name,
			parentId: schema.location.parentId,
			type: schema.location.type,
			timezone: schema.location.timezone,
			isActive: schema.location.isActive,
			createdAt: schema.location.createdAt
		})
		.from(schema.location)
		.orderBy(schema.location.name);

	return { locations };
};

export const actions: Actions = {
	default: async (event) => {
		const { locals, request } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await request.formData();
		const name = formData.get('name');
		const type = formData.get('type') ?? 'sala';
		const parentId = formData.get('parentId');
		const timezone = formData.get('timezone');

		if (!name || typeof name !== 'string' || name.trim() === '') {
			return fail(400, { message: 'NAME_REQUIRED' });
		}

		if (typeof type !== 'string' || !allowedTypes.has(type as LocationType)) {
			return fail(400, { message: 'INVALID_LOCATION_TYPE' });
		}

		const normalizedType: LocationType =
			typeof type === 'string' && allowedTypes.has(type as LocationType)
				? (type as LocationType)
				: 'sala';

		await db.insert(schema.location).values([
			{
				name,
				type: normalizedType,
				parentId: typeof parentId === 'string' && parentId.trim() !== '' ? parentId : null,
				timezone: typeof timezone === 'string' && timezone.trim() !== '' ? timezone : null
			}
		]);

		throw redirect(303, '/equipment/locations');
	},
	update: async (event) => {
		const { locals, request } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await request.formData();
		const id = formData.get('id');
		const name = formData.get('name');
		const type = formData.get('type');
		const parentId = formData.get('parentId');
		const timezone = formData.get('timezone');
		const isActive = formData.get('isActive');

		if (!id || typeof id !== 'string') {
			return fail(400, { message: 'ID_REQUIRED' });
		}

		if (!name || typeof name !== 'string' || name.trim() === '') {
			return fail(400, { message: 'NAME_REQUIRED' });
		}

		if (!type || typeof type !== 'string' || !allowedTypes.has(type as LocationType)) {
			return fail(400, { message: 'INVALID_LOCATION_TYPE' });
		}

		const normalizedType: LocationType =
			typeof type === 'string' && allowedTypes.has(type as LocationType)
				? (type as LocationType)
				: 'sala';

		await db
			.update(schema.location)
			.set({
				name,
				type: normalizedType,
				parentId: typeof parentId === 'string' && parentId.trim() !== '' ? parentId : null,
				timezone: typeof timezone === 'string' && timezone.trim() !== '' ? timezone : null,
				isActive: isActive === 'true'
			})
			.where(eq(schema.location.id, id));

		throw redirect(303, '/equipment/locations');
	}
};
