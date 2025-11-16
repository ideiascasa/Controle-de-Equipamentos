<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { setLocale } from '$lib/paraglide/runtime';

	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { selectedGroup } from '$lib/stores/selectedGroup';
	import GroupManagementCard from '$lib/components/user/GroupManagementCard.svelte';

	let { data, form }: { data: PageServerData; form?: any } = $props();

	let selectedUserId: string | undefined = $state();
	let isAdmin: boolean = $state(false);

	let selectedUserDisplay = $derived(data.allUsers?.find((u) => u.id === selectedUserId));

	// Get users in the selected group
	let usersInSelectedGroup = $derived(
		$selectedGroup && $selectedGroup.groupId && data.groupMemberships
			? data.groupMemberships[$selectedGroup.groupId] || []
			: []
	);

	// Filter out users that are already in the selected group
	let availableUsers = $derived.by(() => {
		if (!data.allUsers || !$selectedGroup?.groupId) {
			return data.allUsers || [];
		}

		const groupUserIds = new Set(usersInSelectedGroup.map((u) => u.id));

		return data.allUsers.filter((user) => !groupUserIds.has(user.id));
	});

	// Languages matching project.inlang/settings.json locales (ordered as in settings.json)
	const languages = [
		{ code: 'pt-br', name: 'Português (Brasil)', flag: '🇧🇷' },
		{ code: 'en', name: 'English', flag: '🇺🇸' },
		{ code: 'es', name: 'Español', flag: '🇪🇸' },
		{ code: 'fr', name: 'Français', flag: '🇫🇷' },
		{ code: 'de', name: 'Deutsch', flag: '🇩🇪' },
		{ code: 'ru', name: 'Русский', flag: '🇷🇺' },
		{ code: 'ja', name: '日本語', flag: '🇯🇵' },
		{ code: 'pt', name: 'Português', flag: '🇵🇹' },
		{ code: 'ar', name: 'العربية', flag: '🇸🇦' },
		{ code: 'it', name: 'Italiano', flag: '🇮🇹' },
		{ code: 'zh', name: '中文', flag: '🇨🇳' },
		{ code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
		{ code: 'zh-CN', name: '中文 (简体)', flag: '🇨🇳' },
		{ code: 'zh-TW', name: '中文 (繁體)', flag: '🇹🇼' },
		{ code: 'zh-HK', name: '中文 (香港)', flag: '🇭🇰' },
		{ code: 'zh-Hans', name: '中文 (简体)', flag: '🇨🇳' },
		{ code: 'zh-Hans-CN', name: '中文 (简体, 中国)', flag: '🇨🇳' },
		{ code: 'zh-Hans-SG', name: '中文 (简体, 新加坡)', flag: '🇸🇬' },
		{ code: 'zh-Hans-MO', name: '中文 (简体, 澳门)', flag: '🇲🇴' },
		{ code: 'zh-Hans-HK', name: '中文 (简体, 香港)', flag: '🇭🇰' }
	];

	function getErrorMessage(message: string | undefined): string | undefined {
		if (!message) return undefined;
		switch (message) {
			case 'USER_ADDED_SUCCESSFULLY':
				return m.userAddedSuccessfully();
			case 'USER_ALREADY_IN_GROUP':
				return m.userAlreadyInGroup();
			case 'GROUP_NOT_SELECTED':
				return m.groupNotSelected();
			case 'NO_ADMIN_RIGHTS_ON_GROUP':
				return m.noAdminRightsOnGroup();
			case 'USER_NOT_FOUND':
				return m.userNotFound();
			case 'GROUP_NOT_FOUND':
				return m.groupNotFound();
			default:
				return message;
		}
	}
</script>

<div
	class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3 grid grid-cols-1 gap-2 *:data-[slot=card]:bg-gradient-to-t"
>
	<Card.Root>
		<Card.Header>
			<Card.Title>
				{#if data.user}
					{m.hello({ name: data.user.name || data.user.username })}
				{:else}
					{m.hello({ name: 'Unknown' })}
				{/if}
			</Card.Title>
			<Card.Description>
				{#if data.user}
					ID: {data.user.id}
				{/if}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="mb-4">
				<h3 class="mb-2 text-sm font-medium">{m.groups()}</h3>
				{#if data.groups && data.groups.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each data.groups as group}
							<span
								class="inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold"
							>
								{group.groupName || m.unknown()}
								{#if group.isAdmin}
									<span class="text-muted-foreground text-xs">{m.admin()}</span>
								{/if}
							</span>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground text-sm">{m.noGroupsAssigned()}</p>
				{/if}
			</div>
			<div class="mb-4">
				<h3 class="mb-2 text-sm font-medium">{m.settings()}</h3>
				<div class="flex flex-wrap gap-2">
					{#each languages as lang}
						<Button
							variant="outline"
							onclick={() => setLocale(lang.code)}
							title={lang.name}
							class="text-xs"
						>
							{lang.flag}
							{lang.name}
						</Button>
					{/each}
				</div>
			</div>
			<form method="post" action="?/logout" use:enhance>
				<Button type="submit">{m.signOut()}</Button>
			</form>
		</Card.Content>
	</Card.Root>

	{#if data.isSystemUser}
		<GroupManagementCard groups={data.systemGroups} formResult={form} />
	{/if}

	{#if data.isAdministrator}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-lg">{m.addUserToGroup()}</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if $selectedGroup && $selectedGroup.groupId}
					<div class="mb-6">
						<div class="mb-3 flex items-center justify-between">
							<h4 class="text-sm font-semibold">{m.usersInGroup()}</h4>
							<span class="text-muted-foreground text-xs">
								{m.selectedGroup()}: {$selectedGroup.groupName || $selectedGroup.groupId}
							</span>
						</div>
						{#if usersInSelectedGroup.length > 0}
							<div class="max-h-60 space-y-2 overflow-y-auto">
								{#each usersInSelectedGroup as groupUser}
									<div
										class="bg-muted/30 flex items-center justify-between rounded-md border px-3 py-2 text-sm"
									>
										<div class="flex items-center gap-2">
											<span class="font-medium">{groupUser.name || groupUser.username}</span>
											<span class="text-muted-foreground">({groupUser.username})</span>
											{#if groupUser.isAdmin}
												<span
													class="text-muted-foreground bg-primary/10 rounded px-1.5 py-0.5 text-xs"
													>{m.admin()}</span
												>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-muted-foreground rounded-md border py-4 text-center text-sm">
								{m.noUsersInGroup()}
							</p>
						{/if}
					</div>
					<div class="border-t pt-4">
						<form
							method="post"
							action="?/addUserToGroup"
							use:enhance={() => {
								return async ({ update, result }) => {
									// Always update to refresh the page data and show the new user in the list
									await update();
									// Reset the form after successful submission
									if (
										result.type === 'success' &&
										result.data?.message === 'USER_ADDED_SUCCESSFULLY'
									) {
										selectedUserId = undefined;
										isAdmin = false;
									}
								};
							}}
						>
							<input type="hidden" name="groupId" value={$selectedGroup.groupId} />
							<div class="mb-4">
								<Label for="userId" class="text-sm font-medium">{m.selectUser()}</Label>
								<Select.Root type="single" bind:value={selectedUserId}>
									<Select.Trigger id="userId" class="mt-2 w-full">
										{selectedUserDisplay
											? `${selectedUserDisplay.name || selectedUserDisplay.username} (${selectedUserDisplay.username})`
											: m.selectUser()}
									</Select.Trigger>
									<Select.Content>
										{#if availableUsers.length > 0}
											{#each availableUsers as user}
												<Select.Item value={user.id}>
													{user.name || user.username} ({user.username})
												</Select.Item>
											{/each}
										{:else}
											<div class="text-muted-foreground px-2 py-1.5 text-sm">
												{m.allUsersAlreadyInGroup()}
											</div>
										{/if}
									</Select.Content>
								</Select.Root>
								<input type="hidden" name="userId" value={selectedUserId || ''} />
							</div>
							<div class="mb-4 flex items-center gap-2">
								<Checkbox id="isAdmin" bind:checked={isAdmin} />
								<Label for="isAdmin" class="cursor-pointer text-sm font-normal">
									{m.addAsAdministrator()}
								</Label>
								<input type="hidden" name="isAdmin" value={isAdmin ? 'true' : 'false'} />
							</div>
							{#if form && form.action === 'addUserToGroup' && form.message}
								<p class="mb-3 text-sm {form.success === true ? 'text-green-600' : 'text-red-600'}">
									{getErrorMessage(form.message)}
								</p>
							{/if}
							<Button
								type="submit"
								disabled={!selectedUserId || availableUsers.length === 0}
								class="w-full"
							>
								{m.addUserToGroup()}
							</Button>
						</form>
					</div>
				{:else}
					<div class="py-6 text-center">
						<p class="text-muted-foreground mb-2 text-sm">{m.selectGroupFirst()}</p>
						<p class="text-muted-foreground text-xs">{m.selectGroupDescription()}</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
