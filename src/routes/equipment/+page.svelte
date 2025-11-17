<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { m } from '$lib/paraglide/messages.js';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto py-6">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Equipamentos</h1>
		<a href="/equipment/create">
			<Button>{m.createEquipment()}</Button>
		</a>
	</div>

	{#if data.equipment && data.equipment.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each data.equipment as item}
				<Card.Root>
					<Card.Header>
						<Card.Title>{item.name}</Card.Title>
						<Card.Description>{item.description || 'Sem descricao'}</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							{#if item.category}
								<p class="text-sm">
									<span class="font-semibold">Categoria:</span> {item.category}
								</p>
							{/if}
							{#if item.serialNumber}
								<p class="text-sm">
									<span class="font-semibold">Numero de Serie:</span> {item.serialNumber}
								</p>
							{/if}
							<p class="text-sm">
								<span class="font-semibold">Status:</span> {item.status}
							</p>
						</div>
					</Card.Content>
					<Card.Footer>
						<a href="/equipment/{item.id}">
							<Button variant="outline" class="w-full">Ver Detalhes</Button>
						</a>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{:else}
		<Card.Root>
			<Card.Content class="py-8 text-center">
				<p class="text-muted-foreground">Nenhum equipamento cadastrado ainda.</p>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
