<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { MenuBread } from '$lib/components/menu-bread.svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

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

	function formatCurrency(value: number | null) {
		if (!value) return 'N/A';
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(value / 100);
	}

	function formatDate(date: Date | null) {
		if (!date) return 'N/A';
		return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
	}

	function getMovementStatusLabel(status: string | null) {
		switch (status) {
			case 'pending':
				return 'Pendente';
			case 'approved':
				return 'Aprovado';
			case 'rejected':
				return 'Rejeitado';
			case 'completed':
				return 'Concluido';
			case 'cancelled':
				return 'Cancelado';
			default:
				return status || 'Desconhecido';
		}
	}

	function getMaintenanceTypeLabel(type: string | null) {
		switch (type) {
			case 'preventive':
				return 'Preventiva';
			case 'corrective':
				return 'Corretiva';
			default:
				return type || 'Desconhecido';
		}
	}
</script>

<div class="flex flex-col gap-4">
	<MenuBread menu={data.menu} />

	<Card.Root>
		<Card.Header>
			<div class="flex justify-between items-start">
				<div>
					<Card.Title>{data.equipment.name}</Card.Title>
					<Card.Description>Codigo: {data.equipment.code}</Card.Description>
				</div>
				<Badge variant={getStatusBadgeVariant(data.equipment.status)}>
					{getStatusLabel(data.equipment.status)}
				</Badge>
			</div>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<h3 class="font-semibold mb-2">Informacoes Basicas</h3>
					<div class="space-y-2 text-sm">
						<div><strong>Categoria:</strong> {data.equipment.category || 'N/A'}</div>
						<div><strong>Fabricante:</strong> {data.equipment.manufacturer || 'N/A'}</div>
						<div><strong>Modelo:</strong> {data.equipment.model || 'N/A'}</div>
						<div><strong>Numero de Serie:</strong> {data.equipment.serialNumber || 'N/A'}</div>
						<div><strong>Data de Aquisicao:</strong> {formatDate(data.equipment.acquisitionDate)}</div>
						<div><strong>Valor:</strong> {formatCurrency(data.equipment.value)}</div>
					</div>
				</div>
				<div>
					<h3 class="font-semibold mb-2">Localizacao e Responsavel</h3>
					<div class="space-y-2 text-sm">
						<div>
							<strong>Localizacao Atual:</strong> {data.equipment.currentLocation || 'N/A'}
						</div>
						<div>
							<strong>Responsavel:</strong>
							{data.equipment.currentUserName || data.equipment.currentUserUsername || 'N/A'}
						</div>
						<div><strong>Criado em:</strong> {formatDate(data.equipment.createdAt)}</div>
						<div>
							<strong>Criado por:</strong>
							{data.equipment.createdByName || data.equipment.createdByUsername || 'N/A'}
						</div>
					</div>
				</div>
			</div>

			{#if data.equipment.description}
				<div class="mt-4">
					<h3 class="font-semibold mb-2">Descricao</h3>
					<p class="text-sm">{data.equipment.description}</p>
				</div>
			{/if}

			{#if data.equipment.notes}
				<div class="mt-4">
					<h3 class="font-semibold mb-2">Observacoes</h3>
					<p class="text-sm">{data.equipment.notes}</p>
				</div>
			{/if}

			<div class="mt-4 flex gap-2">
				<Button onclick={() => goto(`/equipment/movements?equipmentId=${data.equipment.id}`)}>
					Nova Movimentacao
				</Button>
				<Button
					variant="outline"
					onclick={() => goto(`/equipment/maintenance/create?equipmentId=${data.equipment.id}`)}
				>
					Nova Manutencao
				</Button>
			</div>
		</Card.Content>
	</Card.Root>

	{#if data.movements && data.movements.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Movimentacoes Recentes</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-2">
					{#each data.movements as movement}
						<div class="border rounded p-3">
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<div class="text-sm">
										<strong>De:</strong> {movement.fromLocation || 'N/A'} → <strong>Para:</strong>{' '}
										{movement.toLocation}
									</div>
									<div class="text-xs text-muted-foreground mt-1">
										Solicitado por:{' '}
										{movement.requestedByName || movement.requestedByUsername || 'N/A'} em{' '}
										{formatDate(movement.requestDate)}
									</div>
									{#if movement.authorizationDate}
										<div class="text-xs text-muted-foreground">
											Autorizado por:{' '}
											{movement.authorizedByName || movement.authorizedByUsername || 'N/A'} em{' '}
											{formatDate(movement.authorizationDate)}
										</div>
									{/if}
									{#if movement.completionDate}
										<div class="text-xs text-muted-foreground">
											Concluido em: {formatDate(movement.completionDate)}
										</div>
									{/if}
								</div>
								<Badge variant="outline">{getMovementStatusLabel(movement.status)}</Badge>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	{#if data.maintenances && data.maintenances.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Manutencoes</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-2">
					{#each data.maintenances as maintenance}
						<div class="border rounded p-3">
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<div class="text-sm">
										<strong>Tipo:</strong> {getMaintenanceTypeLabel(maintenance.type)} -{' '}
										{maintenance.description}
									</div>
									<div class="text-xs text-muted-foreground mt-1">
										Agendada para: {formatDate(maintenance.scheduledDate)}
										{#if maintenance.completedDate}
											| Concluida em: {formatDate(maintenance.completedDate)}
										{/if}
									</div>
									{#if maintenance.cost}
										<div class="text-xs text-muted-foreground">
											Custo: {formatCurrency(maintenance.cost)}
										</div>
									{/if}
								</div>
								<Badge variant="outline">{getStatusLabel(maintenance.status)}</Badge>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
