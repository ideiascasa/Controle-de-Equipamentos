<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { PageServerData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, Search, Filter } from '@lucide/svelte';
	import { page } from '$app/stores';

	let { data }: { data: PageServerData } = $props();

	let searchValue = $state(data.search || '');
	let statusFilter = $state(data.status || '');
	let locationFilter = $state(data.locationId || '');

	function updateFilters() {
		const params = new URLSearchParams();
		if (searchValue) params.set('search', searchValue);
		if (statusFilter) params.set('status', statusFilter);
		if (locationFilter) params.set('location', locationFilter);
		
		const query = params.toString();
		window.location.href = `/equipment${query ? '?' + query : ''}`;
	}

	function getStatusBadgeVariant(status: string) {
		switch (status) {
			case 'available':
				return 'default';
			case 'in_use':
				return 'secondary';
			case 'maintenance':
				return 'destructive';
			case 'retired':
				return 'outline';
			default:
				return 'default';
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'available':
				return 'Disponivel';
			case 'in_use':
				return 'Em Uso';
			case 'maintenance':
				return 'Manutencao';
			case 'retired':
				return 'Desativado';
			default:
				return status;
		}
	}
</script>

<svelte:head>
	<title>Equipamentos</title>
</svelte:head>

<div class="container mx-auto py-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Equipamentos</h1>
			<p class="text-muted-foreground">Gerencie seus equipamentos</p>
		</div>
		<Button href="/equipment/new">
			<Plus class="mr-2 h-4 w-4" />
			Novo Equipamento
		</Button>
	</div>

	<Card.Root class="p-4">
		<div class="flex flex-col md:flex-row gap-4">
			<div class="flex-1">
				<Label for="search">Buscar</Label>
				<div class="relative">
					<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						id="search"
						bind:value={searchValue}
						placeholder="Nome, codigo ou numero de serie..."
						class="pl-8"
						onkeydown={(e) => e.key === 'Enter' && updateFilters()}
					/>
				</div>
			</div>
			<div>
				<Label for="status">Status</Label>
				<Select.Root bind:selected={statusFilter}>
					<Select.Trigger id="status" class="w-[180px]">
						<Select.Value placeholder="Todos" />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">Todos</Select.Item>
						<Select.Item value="available">Disponivel</Select.Item>
						<Select.Item value="in_use">Em Uso</Select.Item>
						<Select.Item value="maintenance">Manutencao</Select.Item>
						<Select.Item value="retired">Desativado</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
			<div>
				<Label for="location">Localizacao</Label>
				<Select.Root bind:selected={locationFilter}>
					<Select.Trigger id="location" class="w-[180px]">
						<Select.Value placeholder="Todas" />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">Todas</Select.Item>
						{#each data.locations || [] as location}
							<Select.Item value={location.id}>{location.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="flex items-end">
				<Button onclick={updateFilters}>
					<Filter class="mr-2 h-4 w-4" />
					Filtrar
				</Button>
			</div>
		</div>
	</Card.Root>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.equipmentList || [] as item}
			<Card.Root class="hover:shadow-lg transition-shadow">
				<Card.Header>
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<Card.Title class="text-lg">
								<a href="/equipment/{item.equipment.id}" class="hover:underline">
									{item.equipment.name}
								</a>
							</Card.Title>
							<Card.Description class="mt-1">
								{item.equipment.code}
							</Card.Description>
						</div>
						<Badge variant={getStatusBadgeVariant(item.equipment.status)}>
							{getStatusLabel(item.equipment.status)}
						</Badge>
					</div>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if item.location}
						<div class="text-sm">
							<span class="font-medium">Localizacao:</span> {item.location.name}
						</div>
					{/if}
					{#if item.user}
						<div class="text-sm">
							<span class="font-medium">Responsavel:</span> {item.user.name || item.user.username}
						</div>
					{/if}
					{#if item.equipment.category}
						<div class="text-sm">
							<span class="font-medium">Categoria:</span> {item.equipment.category}
						</div>
					{/if}
				</Card.Content>
				<Card.Footer class="flex gap-2">
					<Button variant="outline" size="sm" href="/equipment/{item.equipment.id}">
						Ver Detalhes
					</Button>
					<Button variant="outline" size="sm" href="/equipment/{item.equipment.id}/move">
						Mover
					</Button>
				</Card.Footer>
			</Card.Root>
		{/each}
	</div>

	{#if (!data.equipmentList || data.equipmentList.length === 0)}
		<Card.Root class="p-8 text-center">
			<p class="text-muted-foreground">Nenhum equipamento encontrado.</p>
		</Card.Root>
	{/if}
</div>
