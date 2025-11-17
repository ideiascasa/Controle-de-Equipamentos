<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { MenuBread } from '$lib/components/menu-bread.svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let search = $state('');
	let statusFilter = $state('');

	function handleSearch() {
		const params = new URLSearchParams();
		if (search) params.set('search', search);
		if (statusFilter) params.set('status', statusFilter);
		goto(`/equipment?${params.toString()}`);
	}

	function getStatusBadgeVariant(status: string | null) {
		switch (status) {
			case 'available':
				return 'default';
			case 'allocated':
				return 'secondary';
			case 'maintenance':
				return 'destructive';
			case 'unavailable':
				return 'outline';
			default:
				return 'default';
		}
	}

	function getStatusLabel(status: string | null) {
		switch (status) {
			case 'available':
				return 'Disponivel';
			case 'allocated':
				return 'Alocado';
			case 'maintenance':
				return 'Em Manutencao';
			case 'unavailable':
				return 'Indisponivel';
			default:
				return status || 'Desconhecido';
		}
	}
</script>

<div class="flex flex-col gap-4">
	<MenuBread menu={data.menu} />

	<Card.Root>
		<Card.Header>
			<Card.Title>Equipamentos</Card.Title>
			<Card.Description>Gerenciamento de equipamentos</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col sm:flex-row gap-2">
					<div class="flex-1">
						<Label for="search">Buscar</Label>
						<Input
							id="search"
							bind:value={search}
							placeholder="Buscar por nome, codigo ou descricao..."
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									handleSearch();
								}
							}}
						/>
					</div>
					<div class="w-full sm:w-48">
						<Label for="status">Status</Label>
						<Select.Root bind:selected={statusFilter}>
							<Select.Trigger id="status">
								<Select.Value placeholder="Todos" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">Todos</Select.Item>
								<Select.Item value="available">Disponivel</Select.Item>
								<Select.Item value="allocated">Alocado</Select.Item>
								<Select.Item value="maintenance">Em Manutencao</Select.Item>
								<Select.Item value="unavailable">Indisponivel</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex items-end">
						<Button onclick={handleSearch}>Buscar</Button>
					</div>
					<div class="flex items-end">
						<Button onclick={() => goto('/equipment/create')}>Novo Equipamento</Button>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each data.equipment as item}
						<Card.Root
							class="cursor-pointer hover:shadow-md transition-shadow"
							onclick={() => goto(`/equipment/${item.id}`)}
						>
							<Card.Header>
								<Card.Title class="text-lg">{item.name}</Card.Title>
								<Card.Description>Codigo: {item.code}</Card.Description>
							</Card.Header>
							<Card.Content>
								<div class="flex flex-col gap-2">
									<div class="flex items-center gap-2">
										<Badge variant={getStatusBadgeVariant(item.status)}>
											{getStatusLabel(item.status)}
										</Badge>
									</div>
									{#if item.currentLocation}
										<div class="text-sm text-muted-foreground">
											Localizacao: {item.currentLocation}
										</div>
									{/if}
									{#if item.currentUserName || item.currentUserUsername}
										<div class="text-sm text-muted-foreground">
											Responsavel: {item.currentUserName || item.currentUserUsername}
										</div>
									{/if}
								</div>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>

				{#if data.equipment.length === 0}
					<div class="text-center py-8 text-muted-foreground">
						Nenhum equipamento encontrado
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
</div>
