<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { m } from '$lib/paraglide/messages.js';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto p-4">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Equipamentos</h1>
		<a href="/equipment/create">
			<Button>Novo Equipamento</Button>
		</a>
	</div>

	{#if data.equipment && data.equipment.length > 0}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.equipment as item}
				<Card.Root>
					<Card.Header>
						<Card.Title>{item.name}</Card.Title>
						<Card.Description>
							{item.description || 'Sem descricao'}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							{#if item.serialNumber}
								<p class="text-sm">
									<span class="font-medium">Serial:</span> {item.serialNumber}
								</p>
							{/if}
							{#if item.model}
								<p class="text-sm">
									<span class="font-medium">Modelo:</span> {item.model}
								</p>
							{/if}
							{#if item.manufacturer}
								<p class="text-sm">
									<span class="font-medium">Fabricante:</span> {item.manufacturer}
								</p>
							{/if}
							{#if item.category}
								<p class="text-sm">
									<span class="font-medium">Categoria:</span> {item.category}
								</p>
							{/if}
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium">Status:</span>
								<Badge>{item.status}</Badge>
							</div>
							{#if item.locationName}
								<p class="text-sm">
									<span class="font-medium">Localizacao:</span> {item.locationName}
								</p>
							{/if}
						</div>
					</Card.Content>
					<Card.Footer class="flex gap-2">
						<a href="/equipment/{item.id}">
							<Button variant="outline">Ver Detalhes</Button>
						</a>
						<form method="post" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={item.id} />
							<Button type="submit" variant="destructive">Excluir</Button>
						</form>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{:else}
		<Card.Root>
			<Card.Content class="py-8 text-center">
				<p class="text-muted-foreground">Nenhum equipamento cadastrado</p>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
