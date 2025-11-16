<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { MapPin, User, Package, History, ArrowRight } from 'lucide-svelte';

	export let data: PageData;

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

<div class="container mx-auto py-6 max-w-4xl">
	<div class="mb-6">
		<a href="/equipment" class="text-muted-foreground hover:text-foreground">
			← Voltar para lista
		</a>
	</div>

	<Card.Root class="mb-6">
		<Card.Header>
			<div class="flex justify-between items-start">
				<div>
					<Card.Title class="text-2xl">{data.equipment.name}</Card.Title>
					{#if data.equipment.category}
						<Card.Description class="mt-1">{data.equipment.category}</Card.Description>
					{/if}
				</div>
				<Badge class={getStatusColor(data.equipment.status)}>
					{getStatusLabel(data.equipment.status)}
				</Badge>
			</div>
		</Card.Header>
		<Card.Content>
			{#if data.equipment.description}
				<p class="text-sm text-muted-foreground mb-4">{data.equipment.description}</p>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#if data.equipment.serialNumber}
					<div class="flex items-center gap-2">
						<Package class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm text-muted-foreground">Serial:</span>
						<span class="text-sm font-mono">{data.equipment.serialNumber}</span>
					</div>
				{/if}

				{#if data.equipment.currentLocation}
					<div class="flex items-center gap-2">
						<MapPin class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm text-muted-foreground">Localizacao:</span>
						<span class="text-sm">{data.equipment.currentLocation}</span>
					</div>
				{/if}

				{#if data.equipment.currentUserName || data.equipment.currentUserUsername}
					<div class="flex items-center gap-2">
						<User class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm text-muted-foreground">Usuario:</span>
						<span class="text-sm">{data.equipment.currentUserName || data.equipment.currentUserUsername}</span>
					</div>
				{/if}

				{#if data.equipment.groupName}
					<div class="flex items-center gap-2">
						<span class="text-sm text-muted-foreground">Grupo:</span>
						<span class="text-sm">{data.equipment.groupName}</span>
					</div>
				{/if}
			</div>

			{#if data.isAdmin}
				<div class="mt-4">
					<a href="/equipment/{data.equipment.id}/edit">
						<Button variant="outline">Editar Equipamento</Button>
					</a>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if data.movements.length > 0}
		<Card.Root class="mb-6">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<ArrowRight class="h-5 w-5" />
					Movimentacoes
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-4">
					{#each data.movements as movement}
						<div class="border-l-2 border-muted pl-4">
							<div class="flex justify-between items-start">
								<div>
									<p class="font-medium">
										{movement.fromLocation || 'Localizacao desconhecida'} → {movement.toLocation}
									</p>
									<p class="text-sm text-muted-foreground">
										Solicitado por: {movement.requestedByName || movement.requestedByUsername}
									</p>
									{#if movement.approvedByName || movement.approvedByUsername}
										<p class="text-sm text-muted-foreground">
											Aprovado por: {movement.approvedByName || movement.approvedByUsername}
										</p>
									{/if}
								</div>
								<Badge>{movement.status}</Badge>
							</div>
							<p class="text-xs text-muted-foreground mt-1">
								{movement.createdAt ? new Date(movement.createdAt).toLocaleString('pt-BR') : ''}
							</p>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	{#if data.history.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<History class="h-5 w-5" />
					Historico de Localizacoes
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-4">
					{#each data.history as item}
						<div class="border-l-2 border-muted pl-4">
							<div class="flex justify-between items-start">
								<div>
									<p class="font-medium">{item.location}</p>
									<p class="text-sm text-muted-foreground">Acao: {item.action}</p>
									{#if item.performedByName || item.performedByUsername}
										<p class="text-sm text-muted-foreground">
											Por: {item.performedByName || item.performedByUsername}
										</p>
									{/if}
									{#if item.notes}
										<p class="text-sm text-muted-foreground">{item.notes}</p>
									{/if}
								</div>
							</div>
							<p class="text-xs text-muted-foreground mt-1">
								{item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : ''}
							</p>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
