<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Link } from '@sveltejs/kit';
	import { ArrowLeft, Move, Wrench } from 'lucide-svelte';

	export let data: PageData;
</script>

<div class="container mx-auto py-6">
	<div class="mb-6">
		<Button asChild variant="ghost" class="mb-4">
			<Link href="/equipment">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Voltar
			</Link>
		</Button>
		<h1 class="text-3xl font-bold">{data.equipment.name}</h1>
		<p class="text-muted-foreground">Código: {data.equipment.code}</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Informações</CardTitle>
			</CardHeader>
			<CardContent class="space-y-2">
				<div>
					<span class="font-medium">Status: </span>
					<span>{data.equipment.status}</span>
				</div>
				{#if data.equipment.description}
					<div>
						<span class="font-medium">Descrição: </span>
						<span>{data.equipment.description}</span>
					</div>
				{/if}
				{#if data.equipment.category}
					<div>
						<span class="font-medium">Categoria: </span>
						<span>{data.equipment.category}</span>
					</div>
				{/if}
				{#if data.equipment.brand}
					<div>
						<span class="font-medium">Marca: </span>
						<span>{data.equipment.brand}</span>
					</div>
				{/if}
				{#if data.equipment.model}
					<div>
						<span class="font-medium">Modelo: </span>
						<span>{data.equipment.model}</span>
					</div>
				{/if}
				{#if data.location}
					<div>
						<span class="font-medium">Localização: </span>
						<span>{data.location.name}</span>
					</div>
				{/if}
				{#if data.user}
					<div>
						<span class="font-medium">Responsável: </span>
						<span>{data.user.username}</span>
					</div>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Ações</CardTitle>
			</CardHeader>
			<CardContent class="space-y-2">
				<Button asChild class="w-full">
					<Link href="/equipment/{data.equipment.id}/move">
						<Move class="mr-2 h-4 w-4" />
						Movimentar
					</Link>
				</Button>
				<Button asChild variant="outline" class="w-full">
					<Link href="/equipment/{data.equipment.id}/maintenance">
						<Wrench class="mr-2 h-4 w-4" />
						Registrar Manutenção
					</Link>
				</Button>
			</CardContent>
		</Card>
	</div>

	<div class="mt-6 grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Histórico de Movimentações</CardTitle>
			</CardHeader>
			<CardContent>
				{#if data.movements.length > 0}
					<div class="space-y-4">
						{#each data.movements as item}
							<div class="border-b pb-4 last:border-0">
								<div class="flex justify-between">
									<span class="font-medium">{item.movement.status}</span>
									<span class="text-sm text-muted-foreground">
										{item.movement.requestedAt?.toLocaleDateString()}
									</span>
								</div>
								{#if item.fromLocation || item.toLocation}
									<div class="text-sm text-muted-foreground">
										{item.fromLocation?.name || 'N/A'} → {item.toLocation?.name || 'N/A'}
									</div>
								{/if}
								{#if item.requestedBy}
									<div class="text-sm text-muted-foreground">
										Solicitado por: {item.requestedBy.username}
									</div>
								{/if}
								{#if item.authorizedBy}
									<div class="text-sm text-muted-foreground">
										Autorizado por: {item.authorizedBy.username}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground">Nenhuma movimentação registrada</p>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Histórico de Manutenções</CardTitle>
			</CardHeader>
			<CardContent>
				{#if data.maintenances.length > 0}
					<div class="space-y-4">
						{#each data.maintenances as item}
							<div class="border-b pb-4 last:border-0">
								<div class="flex justify-between">
									<span class="font-medium">{item.maintenance.type}</span>
									<span class="text-sm text-muted-foreground">
										{item.maintenance.status}
									</span>
								</div>
								<div class="text-sm">{item.maintenance.description}</div>
								<div class="text-sm text-muted-foreground">
									{item.maintenance.startDate?.toLocaleDateString()}
									{#if item.maintenance.endDate}
										- {item.maintenance.endDate.toLocaleDateString()}
									{/if}
								</div>
								{#if item.registeredBy}
									<div class="text-sm text-muted-foreground">
										Registrado por: {item.registeredBy.username}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground">Nenhuma manutenção registrada</p>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
