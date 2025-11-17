<script lang="ts">
	import type { PageServerData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';

	let { data }: { data: PageServerData } = $props();
</script>

<div class="container mx-auto p-4">
	<div class="flex justify-between items-center mb-4">
		<h1 class="text-2xl font-bold">{m.equipmentList()}</h1>
		<a href="/equipment/create">
			<Button>{m.createEquipment()}</Button>
		</a>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each data.equipmentList || [] as item}
			<Card.Root>
				<Card.Header>
					<Card.Title>{item.equipment.name}</Card.Title>
					<Card.Description>
						<div class="space-y-1">
							<p><strong>{m.equipmentCode()}:</strong> {item.equipment.code}</p>
							{#if item.equipment.category}
								<p><strong>{m.equipmentCategory()}:</strong> {item.equipment.category}</p>
							{/if}
							<p><strong>{m.equipmentStatus()}:</strong> {item.equipment.status}</p>
							{#if item.currentLocation}
								<p><strong>{m.equipmentLocation()}:</strong> {item.currentLocation.name}</p>
							{/if}
							{#if item.currentUser}
								<p>
									<strong>{m.equipmentCurrentUser()}:</strong>
									{item.currentUser.name || item.currentUser.username}
								</p>
							{/if}
						</div>
					</Card.Description>
				</Card.Header>
				<Card.Footer>
					<a href="/equipment/{item.equipment.id}">
						<Button variant="outline">{m.viewDetails()}</Button>
					</a>
				</Card.Footer>
			</Card.Root>
		{/each}
	</div>

	{#if !data.equipmentList || data.equipmentList.length === 0}
		<div class="text-center py-8">
			<p class="text-muted-foreground">{m.noEquipmentFound()}</p>
		</div>
	{/if}
</div>
