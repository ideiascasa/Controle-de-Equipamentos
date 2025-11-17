import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';
import type { MenuData } from '$lib/components/menu-bread.svelte';
import { db } from '$lib/db';
import { getEquipmentList } from './utils.server';

export const load: PageServerLoad = async () => {
	const result = requireLogin();

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
					title: 'Cadastrar Equipamento',
					href: '/equipment/create',
					description: 'Cadastrar um novo equipamento no sistema.'
				}
			]
		}
	];

	const equipmentList = await getEquipmentList(db, result.user.id);

	return {
		...result,
		menu,
		equipmentList
	};
};

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, '/user/login');
	}

	return locals;
}
