<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { PageServerData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Edit, Move, Wrench, Calendar, MapPin, User } from 'lucide-svelte';

	let { data }: { data: PageServerData } = $props();

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

	function getMovementStatusLabel(status: string) {
		switch (status) {
			case 'pending':
				return 'Pendente';
			case 'approved':
				return 'Aprovado';
			case 'rejected':
				return 'Rejeitado';
			case 'completed':
				return 'Concluido';
			default:
				return status;
		}
	}

	function getMaintenanceTypeLabel(type: string) {
		switch (type) {
			case 'preventive':
				return 'Preventiva';
			case 'corrective':
				return 'Corretiva';
			case 'predictive':
				return 'Preditiva';
			default:
				return type;
		}
	}

	function formatDate(date: Date | null | undefined) {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString('pt-BR');
	}
</script>

<svelte:head>
	<title>{data.equipment.name} - Equipamentos</title>
</svelte:head>

<div class="container mx-auto py-6 max-w-6xl space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">{data.equipment.name}</h1>
			<p class="text-muted-foreground">Codigo: {data.equipment.code}</p>
		</div>
		<div class="flex gap-2">
			<Badge variant={getStatusBadgeVariant(data.equipment.status)}>
				{getStatusLabel(data.equipment.status)}
			</Badge>
			<Button variant="outline" href="/equipment/{data.equipment.id}/edit">
				<Edit class="mr-2 h-4 w-4" />
				Editar
			</Button>
			<Button variant="outline" href="/equipment/{data.equipment.id}/move">
				<Move class="mr-2 h-4 w-4" />
				Mover
			</Button>
			<Button variant="outline" href="/equipment/{data.equipment.id}/maintenance">
				<Wrench class="mr-2 h-4 w-4" />
				Manutencao
			</Button>
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>Informacoes Basicas</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if data.equipment.description}
					<div>
						<span class="font-medium">Descricao:</span>
						<p class="text-muted-foreground">{data.equipment.description}</p>
					</div>
				{/if}
				{#if data.equipment.category}
					<div>
						<span class="font-medium">Categoria:</span> {data.equipment.category}
					</div>
				{/if}
				{#if data.equipment.brand}
					<div>
						<span class="font-medium">Marca:</span> {data.equipment.brand}
					</div>
				{/if}
				{#if data.equipment.model}
					<div>
						<span class="font-medium">Modelo:</span> {data.equipment.model}
					</div>
				{/if}
				{#if data.equipment.serialNumber}
					<div>
						<span class="font-medium">Numero de Serie:</span> {data.equipment.serialNumber}
					</div>
				{/if}
				{#if data.equipment.patrimonyNumber}
					<div>
						<span class="font-medium">Numero de Patrimonio:</span> {data.equipment.patrimonyNumber}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Localizacao e Responsavel</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if data.location}
					<div class="flex items-start gap-2">
						<MapPin class="h-4 w-4 mt-0.5" />
						<div>
							<span class="font-medium">Localizacao:</span>
							<p>{data.location.name}</p>
							{#if data.location.building}
								<p class="text-sm text-muted-foreground">
									{data.location.building}
									{#if data.location.floor} - {data.location.floor}o andar{/if}
									{#if data.location.room} - Sala {data.location.room}{/if}
								</p>
							{/if}
						</div>
					</div>
				{:else}
					<div class="text-muted-foreground">Nenhuma localizacao definida</div>
				{/if}

				{#if data.user}
					<div class="flex items-start gap-2">
						<User class="h-4 w-4 mt-0.5" />
						<div>
							<span class="font-medium">Responsavel:</span>
							<p>{data.user.name || data.user.username}</p>
						</div>
					</div>
				{:else}
					<div class="text-muted-foreground">Nenhum responsavel definido</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Informacoes de Compra</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if data.equipment.purchaseDate}
					<div>
						<span class="font-medium">Data de Compra:</span> {formatDate(data.equipment.purchaseDate)}
					</div>
				{/if}
				{#if data.equipment.purchaseValue}
					<div>
						<span class="font-medium">Valor de Compra:</span> R$ {data.equipment.purchaseValue}
					</div>
				{/if}
				{#if data.equipment.supplier}
					<div>
						<span class="font-medium">Fornecedor:</span> {data.equipment.supplier}
					</div>
				{/if}
				{#if data.equipment.warrantyExpiry}
					<div>
						<span class="font-medium">Fim da Garantia:</span> {formatDate(data.equipment.warrantyExpiry)}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		{#if data.equipment.notes}
			<Card.Root>
				<Card.Header>
					<Card.Title>Observacoes</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-muted-foreground">{data.equipment.notes}</p>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>

	{#if data.movements && data.movements.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Historico de Movimentacoes</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-4">
					{#each data.movements as item}
						<div class="border-l-2 pl-4 py-2">
							<div class="flex items-center justify-between">
								<div>
									<p class="font-medium">
										{#if item.fromLocation}
											{item.fromLocation.name} → {item.toLocation?.name}
										{:else}
											→ {item.toLocation?.name}
										{/if}
									</p>
									<p class="text-sm text-muted-foreground">
										Solicitado por: {item.requestedBy?.name || item.requestedBy?.username || 'N/A'}
										{#if item.authorizedBy}
											| Autorizado por: {item.authorizedBy.name || item.authorizedBy.username}
										{/if}
									</p>
									{#if item.movement.reason}
										<p class="text-sm text-muted-foreground mt-1">{item.movement.reason}</p>
									{/if}
								</div>
								<Badge variant="outline">
									{getMovementStatusLabel(item.movement.status)}
								</Badge>
							</div>
							<p class="text-xs text-muted-foreground mt-1">
								{formatDate(item.movement.requestedAt)}
							</p>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	{#if data.maintenances && data.maintenances.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Historico de Manutencoes</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-4">
					{#each data.maintenances as item}
						<div class="border-l-2 pl-4 py-2">
							<div class="flex items-center justify-between">
								<div>
									<p class="font-medium">{item.maintenance.description}</p>
									<p class="text-sm text-muted-foreground">
										Tipo: {getMaintenanceTypeLabel(item.maintenance.type)}
										| Status: {item.maintenance.status}
									</p>
									{#if item.maintenance.cost}
										<p class="text-sm text-muted-foreground">
											Custo: R$ {item.maintenance.cost}
										</p>
									{/if}
									<p class="text-sm text-muted-foreground">
										Registrado por: {item.registeredBy?.name || item.registeredBy?.username || 'N/A'}
									</p>
								</div>
								<Badge variant="outline">{item.maintenance.status}</Badge>
							</div>
							<p class="text-xs text-muted-foreground mt-1">
								Inicio: {formatDate(item.maintenance.startDate)}
								{#if item.maintenance.endDate}
									| Fim: {formatDate(item.maintenance.endDate)}
								{/if}
							</p>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
