<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { setLocale } from '$lib/paraglide/runtime';

	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageServerData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import {
		AlertDialog,
		AlertDialogTrigger,
		AlertDialogContent,
		AlertDialogHeader,
		AlertDialogFooter,
		AlertDialogTitle,
		AlertDialogDescription,
		AlertDialogCancel,
		AlertDialogAction
	} from '$lib/components/ui/alert-dialog';
	import { selectedGroup } from '$lib/stores/selectedGroup';
	import type { GroupSummary } from '$lib/utils/groups';

	let { data, form }: { data: PageServerData; form?: any } = $props();

	let selectedUserId: string | undefined = $state();

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

	let systemGroups: GroupSummary[] = $derived(data.systemGroups ?? []);
	let sortedSystemGroups = $derived.by(() =>
		[...systemGroups].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
	);

	type EnhanceArgs = Parameters<SubmitFunction>[0];

	let groupName = $state('');
	let groupDescription = $state('');
	let createPending = $state(false);
	let deletePendingId: string | null = $state(null);
	let createFeedback: { isSuccess: boolean; message: string | undefined } | null = $state(null);
	let deleteFeedback: { isSuccess: boolean; message: string | undefined } | null = $state(null);
	let activeFeedback = $derived(createFeedback ?? deleteFeedback);

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

	function resolveSystemMessage(message: string | undefined): string | undefined {
		if (!message) return undefined;
		switch (message) {
			case 'GROUP_CREATED_SUCCESS':
				return m.groupCreatedSuccess();
			case 'GROUP_DELETED_SUCCESS':
				return m.groupDeletedSuccess();
			case 'GROUP_NAME_REQUIRED':
				return m.groupNameRequired();
			case 'GROUP_NAME_TOO_LONG':
				return m.groupNameTooLong();
			case 'GROUP_DESCRIPTION_TOO_LONG':
				return m.groupDescriptionTooLong();
			case 'GROUP_HAS_MEMBERS':
				return m.groupHasMembers();
			case 'GROUP_NOT_FOUND':
				return m.groupNotFound();
			case 'SYSTEM_USER_ONLY':
				return m.systemUserOnly();
			case 'DATABASE_ERROR':
				return m.errorOccurred();
			default:
				return message;
		}
	}

	function enhanceCreate() {
		return async ({ update, result, form }: EnhanceArgs) => {
			createPending = true;
			createFeedback = null;
			deleteFeedback = null;

			if (result.type === 'success') {
				await update();
				createFeedback = {
					isSuccess: true,
					message: result.data?.message ?? 'GROUP_CREATED_SUCCESS'
				};
				groupName = '';
				groupDescription = '';
				if (form instanceof HTMLFormElement) {
					form.reset();
				}
			} else if (result.type === 'failure') {
				createFeedback = {
					isSuccess: false,
					message: result.data?.message ?? 'DATABASE_ERROR'
				};
			}

			createPending = false;
		};
	}

	function enhanceDelete(groupId: string) {
		return async ({ update, result }: EnhanceArgs) => {
			deletePendingId = groupId;
			deleteFeedback = null;
			createFeedback = null;

			if (result.type === 'success') {
				await update();
				deleteFeedback = {
					isSuccess: true,
					message: result.data?.message ?? 'GROUP_DELETED_SUCCESS'
				};
			} else if (result.type === 'failure') {
				deleteFeedback = {
					isSuccess: false,
					message: result.data?.message ?? 'DATABASE_ERROR'
				};
			}

			deletePendingId = null;
		};
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
		<Card.Root data-testid="system-group-card">
			<Card.Header>
				<Card.Title>{m.systemGroupManagementTitle()}</Card.Title>
				<Card.Description>{m.systemGroupManagementDescription()}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<section>
					<h4 class="mb-2 text-sm font-semibold text-muted-foreground">{m.currentGroups()}</h4>
					{#if sortedSystemGroups.length > 0}
						<ul class="space-y-3">
							{#each sortedSystemGroups as group (group.id)}
								<li class="border-border/60 flex flex-col gap-2 rounded-lg border p-3">
									<div class="flex flex-col gap-1">
										<span class="text-sm font-semibold">
											{group.name || m.unknown()}
										</span>
										{#if group.description}
											<p class="text-muted-foreground text-xs">{group.description}</p>
										{/if}
									</div>
									<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
										<Badge variant="secondary">
											{m.membersCount({ count: group.membersCount })}
										</Badge>
										<span>{m.createdAtLabel({ date: group.createdAt.slice(0, 10) })}</span>
									</div>
									<div class="flex justify-end">
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													data-testid={`delete-group-${group.id}`}
												>
													{m.deleteGroup()}
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>{m.groupDeleteConfirmTitle()}</AlertDialogTitle>
													<AlertDialogDescription>
														{m.groupDeleteConfirmDescription({
															name: group.name || m.unknown()
														})}
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>{m.cancel()}</AlertDialogCancel>
													<form
														method="post"
														action="?/deleteSystemGroup"
														use:enhance={enhanceDelete(group.id)}
													>
														<input type="hidden" name="groupId" value={group.id} />
														<AlertDialogAction asChild>
															<Button
																type="submit"
																variant="destructive"
																size="sm"
																disabled={deletePendingId === group.id}
															>
																{deletePendingId === group.id
																	? m.deleting()
																	: m.confirmDelete()}
															</Button>
														</AlertDialogAction>
													</form>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-muted-foreground text-sm">{m.noSystemGroups()}</p>
					{/if}
				</section>

				<form method="post" action="?/createSystemGroup" class="space-y-4" use:enhance={enhanceCreate}>
					<div class="space-y-2">
						<Label for="system-group-name">{m.groupNameLabel()}</Label>
						<Input
							id="system-group-name"
							name="name"
							bind:value={groupName}
							placeholder={m.groupNamePlaceholder()}
							required
							maxlength="64"
						/>
					</div>
					<div class="space-y-2">
						<Label for="system-group-description">{m.groupDescriptionLabel()}</Label>
						<Textarea
							id="system-group-description"
							name="description"
							bind:value={groupDescription}
							placeholder={m.groupDescriptionPlaceholder()}
							maxlength="256"
							rows={3}
						/>
					</div>
					{#if activeFeedback}
						<p
							class="text-sm {activeFeedback.isSuccess ? 'text-emerald-600' : 'text-red-600'}"
						>
							{resolveSystemMessage(activeFeedback.message)}
						</p>
					{/if}
					<Button type="submit" class="w-full" disabled={createPending}>
						{createPending ? m.creatingGroup() : m.createGroupButton()}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
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
							{#if form && form.message}
								<p
									class="mb-3 text-sm {form.message === 'USER_ADDED_SUCCESSFULLY'
										? 'text-green-600'
										: 'text-red-600'}"
								>
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
