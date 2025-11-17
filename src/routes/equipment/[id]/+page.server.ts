import { redirect, error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import { getEquipmentById, getEquipmentMovements, getEquipmentMaintenances } from '../utils.server';

export const load: PageServerLoad = async ({ params }) => {
	const result = requireLogin();

	const equipment = await getEquipmentById(db, params.id);

	if (!equipment) {
		throw error(404, 'Equipment not found');
	}

	const movements = await getEquipmentMovements(db, params.id);
	const maintenances = await getEquipmentMaintenances(db, params.id);

	const menu: MenuData = [
		{
			trigger: 'Equipamentos',
			items: [
				{
					title: 'Lista de Equipamentos',
					href: '/equipment',
					description: 'Visualizar todos os equipamentos cadastrados.'
				},
				{
					title: 'Detalhes do Equipamento',
					href: `/equipment/${params.id}`,
					description: 'Visualizar detalhes do equipamento.'
				}
			]
		}
	];

	return {
		...result,
		menu,
		equipment,
		movements,
		maintenances
	};
};

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}
