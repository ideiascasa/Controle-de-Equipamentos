<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages.js';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
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
	import type { GroupSummary } from '$lib/utils/groups';

	export let groups: GroupSummary[] = [];
	export let formResult: any;

	let name = $state('');
	let description = $state('');
	let createPending = $state(false);
	let deletePendingId: string | null = $state(null);

	const sortedGroups = $derived(() => {
		const copy = [...groups];
		return copy.sort((a, b) => {
			const aName = a.name ?? '';
			const bName = b.name ?? '';
			return aName.localeCompare(bName);
		});
	});

	const createFeedback = $derived(() => {
		if (!formResult || formResult.action !== 'createSystemGroup') {
			return null;
		}
		return {
			message: formResult.message as string | undefined,
			isSuccess: formResult.success === true
		};
	});

	const deleteFeedback = $derived(() => {
		if (!formResult || formResult.action !== 'deleteSystemGroup') {
			return null;
		}
		return {
			message: formResult.message as string | undefined,
			isSuccess: formResult.success === true
		};
	});

	function resolveMessage(code: string | undefined): string | undefined {
		if (!code) return undefined;
		switch (code) {
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
			case 'GROUP_CREATE_FAILED':
				return m.groupCreateFailed();
			case 'GROUP_HAS_MEMBERS':
				return m.groupHasMembers();
			case 'GROUP_NOT_FOUND':
				return m.groupNotFound();
			case 'SYSTEM_USER_ONLY':
				return m.systemUserOnly();
			default:
				return code;
		}
	}

	function enhanceCreate() {
		createPending = true;
		return async ({ update, result }: any) => {
			try {
				await update();
				if (result?.type === 'success' && result?.data?.success) {
					name = '';
					description = '';
				}
			} finally {
				createPending = false;
			}
		};
	}

	function enhanceDelete(groupId: string) {
		deletePendingId = groupId;
		return async ({ update }: any) => {
			try {
				await update();
			} finally {
				deletePendingId = null;
			}
		};
	}

	const hasFeedback = $derived(() => !!createFeedback || !!deleteFeedback);
</script>

<Card.Root data-testid="system-group-card">
	<Card.Header>
		<Card.Title>{m.systemGroupManagementTitle()}</Card.Title>
		<Card.Description>{m.systemGroupManagementDescription()}</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		<section>
			<h4 class="mb-2 text-sm font-semibold text-muted-foreground">{m.currentGroups()}</h4>
			{#if sortedGroups.length > 0}
				<ul class="space-y-3">
					{#each sortedGroups as group (group.id)}
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
										<Button data-testid={`delete-group-${group.id}`} variant="outline" size="sm">
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
													<Button type="submit" variant="destructive" size="sm" disabled={deletePendingId === group.id}>
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
					bind:value={name}
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
					bind:value={description}
					placeholder={m.groupDescriptionPlaceholder()}
					maxlength="256"
					rows={3}
				/>
			</div>
			{#if hasFeedback}
				<p
					class="text-sm {createFeedback?.isSuccess || deleteFeedback?.isSuccess
						? 'text-emerald-600'
						: 'text-red-600'}"
				>
					{resolveMessage(createFeedback?.message || deleteFeedback?.message)}
				</p>
			{/if}
			<Button type="submit" class="w-full" disabled={createPending}>
				{createPending ? m.creatingGroup() : m.createGroupButton()}
			</Button>
		</form>
	</Card.Content>
</Card.Root>
