<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight, Plus } from 'lucide-svelte';

	export let data: PageData;

	function getStatusColor(status: string | null | undefined): string {
		switch (status) {
			case 'pending':
				return 'bg-yellow-500';
			case 'approved':
				return 'bg-blue-500';
			case 'rejected':
				return 'bg-red-500';
			case 'completed':
				return 'bg-green-500';
			case 'cancelled':
				return 'bg-gray-500';
			default:
				return 'bg-gray-500';
		}
	}

	function getStatusLabel(status: string | null | undefined): string {
		switch (status) {
			case 'pending':
				return 'Pendente';
			case 'approved':
				return 'Aprovado';
			case 'rejected':
				return 'Rejeitado';
			case 'completed':
				return 'Completo';
			case 'cancelled':
				return 'Cancelado';
			default:
				return status || 'Desconhecido';
		}
	}
</script>

<div class="container mx-auto py-6">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Movimentacoes</h1>
			<p class="text-muted-foreground mt-1">Gerencie movimentacoes de equipamentos</p>
		</div>
		<a href="/equipment/movements/create">
			<Button>
				<Plus class="mr-2 h-4 w-4" />
				Nova Movimentacao
			</Button>
		</a>
	</div>

	{#if data.movements.length === 0}
		<Card.Root>
			<Card.Content class="text-center py-12">
				<p class="text-muted-foreground">Nenhuma movimentacao encontrada.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-4">
			{#each data.movements as movement}
				<Card.Root>
					<Card.Content class="pt-6">
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-2">
									<h3 class="font-semibold">{movement.equipmentName}</h3>
									<Badge class={getStatusColor(movement.status)}>
										{getStatusLabel(movement.status)}
									</Badge>
								</div>
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<span>{movement.fromLocation || 'Localizacao desconhecida'}</span>
									<ArrowRight class="h-4 w-4" />
									<span>{movement.toLocation}</span>
								</div>
								<p class="text-sm text-muted-foreground mt-2">
									Solicitado por: {movement.requestedByName || movement.requestedByUsername}
								</p>
								{#if movement.approvedByName || movement.approvedByUsername}
									<p class="text-sm text-muted-foreground">
										Aprovado por: {movement.approvedByName || movement.approvedByUsername}
									</p>
								{/if}
								<p class="text-xs text-muted-foreground mt-2">
									{movement.createdAt ? new Date(movement.createdAt).toLocaleString('pt-BR') : ''}
								</p>
							</div>
							<a href="/equipment/movements/{movement.id}">
								<Button variant="outline" size="sm">Ver Detalhes</Button>
							</a>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
