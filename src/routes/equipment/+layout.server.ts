import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/user/login');
	}

	const activePath = url.pathname;

	const navigation = [
		{ href: '/equipment', label: 'Dashboard', active: activePath === '/equipment' },
		{ href: '/equipment/new', label: 'Novo equipamento', active: activePath.startsWith('/equipment/new') },
		{ href: '/equipment/locations', label: 'Localizacoes', active: activePath.startsWith('/equipment/locations') },
		{ href: '/equipment/approvals', label: 'Aprovacoes', active: activePath.startsWith('/equipment/approvals') },
		{ href: '/equipment/reports', label: 'Relatorios', active: activePath.startsWith('/equipment/reports') }
	];

	return {
		user: locals.user,
		navigation
	};
};
