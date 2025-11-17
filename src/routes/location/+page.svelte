<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto p-4">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Localizacoes</h1>
		<a href="/location/create">
			<Button>Nova Localizacao</Button>
		</a>
	</div>

	{#if data.locations && data.locations.length > 0}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.locations as location}
				<Card.Root>
					<Card.Header>
						<Card.Title>{location.name}</Card.Title>
						<Card.Description>
							{location.description || 'Sem descricao'}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							{#if location.address}
								<p class="text-sm">
									<span class="font-medium">Endereco:</span> {location.address}
								</p>
							{/if}
							{#if location.building}
								<p class="text-sm">
									<span class="font-medium">Edificio:</span> {location.building}
								</p>
							{/if}
							{#if location.floor}
								<p class="text-sm">
									<span class="font-medium">Andar:</span> {location.floor}
								</p>
							{/if}
							{#if location.room}
								<p class="text-sm">
									<span class="font-medium">Sala:</span> {location.room}
								</p>
							{/if}
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium">Status:</span>
								<Badge>{location.isActive ? 'Ativa' : 'Inativa'}</Badge>
							</div>
						</div>
					</Card.Content>
					<Card.Footer class="flex gap-2">
						<form method="post" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={location.id} />
							<Button type="submit" variant="destructive">Excluir</Button>
						</form>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{:else}
		<Card.Root>
			<Card.Content class="py-8 text-center">
				<p class="text-muted-foreground">Nenhuma localizacao cadastrada</p>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
