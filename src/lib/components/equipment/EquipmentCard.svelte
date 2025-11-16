<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { MapPin, User, Package } from 'lucide-svelte';

	interface Equipment {
		id: string;
		name: string;
		description?: string | null;
		serialNumber?: string | null;
		category?: string | null;
		status?: string | null;
		currentLocation?: string | null;
		currentUserId?: string | null;
		currentUserName?: string | null;
		currentUserUsername?: string | null;
		groupId?: string | null;
		groupName?: string | null;
		imageUrl?: string | null;
		createdAt?: Date | null;
	}

	const { equipment, isAdmin = false } = $props<{
		equipment: Equipment;
		isAdmin?: boolean;
	}>();

	function getStatusColor(status: string | null | undefined): string {
		switch (status) {
			case 'available':
				return 'bg-green-500';
			case 'allocated':
				return 'bg-blue-500';
			case 'maintenance':
				return 'bg-yellow-500';
			case 'pending_movement':
				return 'bg-orange-500';
			case 'retired':
				return 'bg-gray-500';
			default:
				return 'bg-gray-500';
		}
	}

	function getStatusLabel(status: string | null | undefined): string {
		switch (status) {
			case 'available':
				return 'Disponivel';
			case 'allocated':
				return 'Alocado';
			case 'maintenance':
				return 'Manutencao';
			case 'pending_movement':
				return 'Movimentacao Pendente';
			case 'retired':
				return 'Desativado';
			default:
				return status || 'Desconhecido';
		}
	}
</script>

<Card.Root class="hover:shadow-lg transition-shadow">
	<Card.Header>
		<div class="flex justify-between items-start">
			<div class="flex-1">
				<Card.Title class="text-lg">{equipment.name}</Card.Title>
				{#if equipment.category}
					<Card.Description class="mt-1">{equipment.category}</Card.Description>
				{/if}
			</div>
			<Badge class={getStatusColor(equipment.status)}>
				{getStatusLabel(equipment.status)}
			</Badge>
		</div>
	</Card.Header>
	<Card.Content>
		{#if equipment.description}
			<p class="text-sm text-muted-foreground mb-4">{equipment.description}</p>
		{/if}

		<div class="space-y-2">
			{#if equipment.serialNumber}
				<div class="flex items-center gap-2 text-sm">
					<Package class="h-4 w-4 text-muted-foreground" />
					<span class="text-muted-foreground">Serial:</span>
					<span class="font-mono">{equipment.serialNumber}</span>
				</div>
			{/if}

			{#if equipment.currentLocation}
				<div class="flex items-center gap-2 text-sm">
					<MapPin class="h-4 w-4 text-muted-foreground" />
					<span class="text-muted-foreground">Localizacao:</span>
					<span>{equipment.currentLocation}</span>
				</div>
			{/if}

			{#if equipment.currentUserName || equipment.currentUserUsername}
				<div class="flex items-center gap-2 text-sm">
					<User class="h-4 w-4 text-muted-foreground" />
					<span class="text-muted-foreground">Usuario:</span>
					<span>{equipment.currentUserName || equipment.currentUserUsername}</span>
				</div>
			{/if}

			{#if equipment.groupName}
				<div class="flex items-center gap-2 text-sm">
					<span class="text-muted-foreground">Grupo:</span>
					<span>{equipment.groupName}</span>
				</div>
			{/if}
		</div>
	</Card.Content>
	<Card.Footer class="flex justify-between">
		<a href="/equipment/{equipment.id}">
			<Button variant="outline" size="sm">Ver Detalhes</Button>
		</a>
		{#if isAdmin}
			<a href="/equipment/{equipment.id}/edit">
				<Button variant="ghost" size="sm">Editar</Button>
			</a>
		{/if}
	</Card.Footer>
</Card.Root>
