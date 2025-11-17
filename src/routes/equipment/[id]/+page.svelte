<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { m } from '$lib/paraglide/messages.js';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto py-6 max-w-4xl">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">{data.equipment.name}</h1>
		<div class="flex gap-2">
			<a href="/equipment/{data.equipment.id}/move">
				<Button variant="outline">Mover Equipamento</Button>
			</a>
			<a href="/equipment/{data.equipment.id}/maintenance">
				<Button variant="outline">Registrar Manutencao</Button>
			</a>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<Card.Root>
			<Card.Header>
				<Card.Title>Informacoes Gerais</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-2">
				<p><span class="font-semibold">Nome:</span> {data.equipment.name}</p>
				{#if data.equipment.description}
					<p><span class="font-semibold">Descricao:</span> {data.equipment.description}</p>
				{/if}
				{#if data.equipment.serialNumber}
					<p>
						<span class="font-semibold">Numero de Serie:</span> {data.equipment.serialNumber}
					</p>
				{/if}
				{#if data.equipment.category}
					<p><span class="font-semibold">Categoria:</span> {data.equipment.category}</p>
				{/if}
				<p><span class="font-semibold">Status:</span> {data.equipment.status}</p>
				{#if data.currentLocation}
					<p>
						<span class="font-semibold">Localizacao Atual:</span> {data.currentLocation.name}
					</p>
				{/if}
				{#if data.currentUser}
					<p>
						<span class="font-semibold">Usuario Atual:</span>
						{data.currentUser.name || data.currentUser.username}
					</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Historico de Movimentacoes</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if data.movements && data.movements.length > 0}
					<div class="space-y-2">
						{#each data.movements as movement}
							<div class="border-b pb-2">
								<p class="text-sm">
									<span class="font-semibold">Status:</span> {movement.status}
								</p>
								<p class="text-sm">
									<span class="font-semibold">Data:</span>
									{new Date(movement.createdAt).toLocaleDateString('pt-BR')}
								</p>
								{#if movement.reason}
									<p class="text-sm">
										<span class="font-semibold">Motivo:</span> {movement.reason}
									</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground text-sm">Nenhuma movimentacao registrada</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<Card.Root class="mt-6">
		<Card.Header>
			<Card.Title>Historico de Manutencoes</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if data.maintenances && data.maintenances.length > 0}
				<div class="space-y-2">
					{#each data.maintenances as maintenance}
						<div class="border-b pb-2">
							<p class="text-sm">
								<span class="font-semibold">Tipo:</span> {maintenance.maintenanceType}
							</p>
							<p class="text-sm">
								<span class="font-semibold">Descricao:</span> {maintenance.description}
							</p>
							<p class="text-sm">
								<span class="font-semibold">Status:</span> {maintenance.status}
							</p>
							<p class="text-sm">
								<span class="font-semibold">Data:</span>
								{new Date(maintenance.createdAt).toLocaleDateString('pt-BR')}
							</p>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-muted-foreground text-sm">Nenhuma manutencao registrada</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
