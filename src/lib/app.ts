import type { Icon } from '@tabler/icons-svelte';
import CodeIcon from '@tabler/icons-svelte/icons/code';
import DatabaseIcon from '@tabler/icons-svelte/icons/database';
import CloudIcon from '@tabler/icons-svelte/icons/cloud';
import ServerIcon from '@tabler/icons-svelte/icons/server';
import BoxIcon from '@tabler/icons-svelte/icons/box';
import ToolIcon from '@tabler/icons-svelte/icons/tool';
import { m } from '$lib/paraglide/messages.js';

export interface SoftwareItem {
	title: string;
	url: string;
	icon?: Icon;
}

type GroupData = { groupId: string; groupName: string | null; isAdmin: boolean }[];

export function getSoftwareList(groups?: GroupData): SoftwareItem[] {
	const items: SoftwareItem[] = [
		{
			title: m.home(),
			url: '/home',
			icon: CodeIcon
		}
	];

	// Only show database manager if user is in group ID 1
	if (groups && groups.some((g) => g.groupId === '1')) {
		items.push({
			title: m.softwareDataManager(),
			url: '/doc/schema',
			icon: DatabaseIcon
		});
	}

	items.push(
		{
			title: m.softwareEquipmentManager(),
			url: '/equipment',
			icon: ToolIcon
		},
		{
			title: m.softwareCloudService(),
			url: '/software/cloud-service',
			icon: CloudIcon
		},
		{
			title: m.softwareServerPlatform(),
			url: '/software/server-platform',
			icon: ServerIcon
		},
		{
			title: m.softwarePackageManager(),
			url: '/software/package-manager',
			icon: BoxIcon
		}
	);

	return items;
}
