<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Link } from '@sveltejs/kit';
	import PlusIcon from '@tabler/icons-svelte/icons/plus';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto p-6">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">{m.equipmentTitle()}</h1>
		<Link href="/equipment/create">
			<Button>
				<PlusIcon class="mr-2 h-4 w-4" />
				{m.equipmentCreate()}
			</Button>
		</Link>
	</div>

	{#if data.equipment && data.equipment.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each data.equipment as item}
				<Card.Root>
					<Card.Header>
						<Card.Title>
							<Link href="/equipment/{item.id}">{item.name}</Link>
						</Card.Title>
						<Card.Description>{item.description || m.equipmentNoDescription()}</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							{#if item.serialNumber}
								<p class="text-sm">
									<span class="font-semibold">{m.equipmentSerialNumber()}:</span> {item.serialNumber}
								</p>
							{/if}
							{#if item.status}
								<p class="text-sm">
									<span class="font-semibold">{m.equipmentStatus()}:</span> {item.status}
								</p>
							{/if}
						</div>
					</Card.Content>
					<Card.Footer>
						<Link href="/equipment/{item.id}">
							<Button variant="outline" class="w-full">{m.equipmentViewDetails()}</Button>
						</Link>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{:else}
		<Card.Root>
			<Card.Content class="pt-6">
				<p class="text-center text-muted-foreground">{m.equipmentNoItems()}</p>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
