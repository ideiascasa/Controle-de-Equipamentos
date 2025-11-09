import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { and, eq, sql, type SQL } from 'drizzle-orm';

const statusOptions = ['ativo', 'em_manutencao', 'inativo'] as const;
type EquipmentStatus = (typeof statusOptions)[number];
const criticalityOptions = ['baixa', 'media', 'alta'] as const;
type EquipmentCriticality = (typeof criticalityOptions)[number];

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/user/login');
	}

	const totals = await db
		.select({
			status: schema.equipment.status,
			count: sql<number>`count(*)`
		})
		.from(schema.equipment)
		.groupBy(schema.equipment.status);

	return { totals };
};

export const actions: Actions = {
	export: async (event) => {
		const { locals, request } = event;

		if (!locals.user) {
			return fail(401, { message: 'UNAUTHORIZED' });
		}

		const formData = await request.formData();
		const status = formData.get('status');
		const criticality = formData.get('criticality');
		const category = formData.get('category');

		const conditions: SQL[] = [];

		if (typeof status === 'string' && statusOptions.includes(status as EquipmentStatus)) {
			conditions.push(eq(schema.equipment.status, status as EquipmentStatus));
		}

		if (
			typeof criticality === 'string' &&
			criticalityOptions.includes(criticality as EquipmentCriticality)
		) {
			conditions.push(eq(schema.equipment.criticality, criticality as EquipmentCriticality));
		}

		if (typeof category === 'string' && category !== '') {
			conditions.push(eq(schema.equipment.category, category));
		}

		const baseQuery = db
			.select({
				id: schema.equipment.id,
				assetCode: schema.equipment.assetCode,
				name: schema.equipment.name,
				status: schema.equipment.status,
				criticality: schema.equipment.criticality,
				category: schema.equipment.category,
				locationId: schema.equipment.locationId,
				updatedAt: schema.equipment.updatedAt
			})
			.from(schema.equipment);

		const rows =
			conditions.length === 0
				? await baseQuery
				: conditions.length === 1
					? await baseQuery.where(conditions[0]!)
					: await baseQuery.where(and(...conditions));

		const header = ['id', 'assetCode', 'name', 'status', 'criticality', 'category', 'locationId', 'updatedAt'];

		const csv = [
			header.join(','),
			...rows.map((row) =>
				header
					.map((key) => {
						const value = row[key as keyof typeof row];
						if (!value) return '';
						const formatted = typeof value === 'string' ? value : String(value);
						return `"${formatted.replace(/"/g, '""')}"`;
					})
					.join(',')
			)
		].join('\n');

		return new Response(csv, {
			headers: {
				'content-type': 'text/csv',
				'content-disposition': 'attachment; filename="equipamentos.csv"'
			}
		});
	}
};
