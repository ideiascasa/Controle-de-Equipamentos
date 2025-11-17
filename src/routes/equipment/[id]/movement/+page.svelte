<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';
	import { Link } from '@sveltejs/kit';

	let { data, form }: { data: PageData; form?: any } = $props();
</script>

<div class="container mx-auto p-6 max-w-2xl">
	<Link href="/equipment/{data.equipment.id}" class="inline-flex items-center text-sm text-muted-foreground mb-4">
		<ArrowLeftIcon class="mr-2 h-4 w-4" />
		{m.equipmentBackToDetails()}
	</Link>

	<Card.Root>
		<Card.Header>
			<Card.Title>{m.equipmentMove()}</Card.Title>
			<Card.Description>{m.equipmentMoveDescription()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance>
				<div class="space-y-4">
					<div>
						<Label>{m.equipmentEquipment()}</Label>
						<p class="text-sm text-muted-foreground">{data.equipment.name}</p>
					</div>

					<div>
						<Label for="toLocationId">{m.equipmentToLocation()}</Label>
						<Select.Root name="toLocationId">
							<Select.Trigger>
								<Select.Value placeholder={m.equipmentSelectLocation()} />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">{m.equipmentNoLocation()}</Select.Item>
								{#each data.locations || [] as location}
									<Select.Item value={location.id}>{location.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<Label for="reason">{m.equipmentReason()}</Label>
						<Textarea id="reason" name="reason" />
					</div>

					{#if form?.error}
						<div class="text-sm text-destructive">{form.error}</div>
					{/if}

					<div class="flex justify-end gap-2">
						<Link href="/equipment/{data.equipment.id}">
							<Button type="button" variant="outline">{m.equipmentCancel()}</Button>
						</Link>
						<Button type="submit">{m.equipmentRequestMovement()}</Button>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
