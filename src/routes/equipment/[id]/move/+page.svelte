<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';

	let { data, form }: { data: PageServerData; form?: any } = $props();

	let toLocationId = $state('');
	let toUserId = $state('');
</script>

<svelte:head>
	<title>Mover Equipamento - {data.equipment.name}</title>
</svelte:head>

<div class="container mx-auto py-6 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">Mover Equipamento</h1>
		<p class="text-muted-foreground">
			<a href="/equipment/{data.equipment.id}" class="hover:underline">
				{data.equipment.name} ({data.equipment.code})
			</a>
		</p>
	</div>

	<form method="POST" action="?/requestMovement" use:enhance>
		<input type="hidden" name="equipmentId" value={data.equipment.id} />

		<Card.Root class="p-6 space-y-6">
			<Card.Header>
				<Card.Title>Nova Localizacao</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<Label for="toLocationId">Localizacao Destino *</Label>
					<Select.Root bind:selected={toLocationId}>
						<Select.Trigger id="toLocationId" name="toLocationId" required>
							<Select.Value placeholder="Selecione uma localizacao" />
						</Select.Trigger>
						<Select.Content>
							{#each data.locations || [] as location}
								<Select.Item value={location.id}>{location.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div>
					<Label for="toUserId">Usuario Responsavel</Label>
					<Select.Root bind:selected={toUserId}>
						<Select.Trigger id="toUserId" name="toUserId">
							<Select.Value placeholder="Selecione um usuario (opcional)" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">Nenhum</Select.Item>
							{#each data.users || [] as user}
								<Select.Item value={user.id}>
									{user.name || user.username}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div>
					<Label for="reason">Motivo da Movimentacao</Label>
					<Textarea
						id="reason"
						name="reason"
						placeholder="Descreva o motivo da movimentacao..."
					/>
				</div>

				<div>
					<Label for="notes">Observacoes</Label>
					<Textarea id="notes" name="notes" placeholder="Observacoes adicionais..." />
				</div>
			</Card.Content>
		</Card.Root>

		<div class="flex gap-4 mt-6">
			<Button type="submit">Solicitar Movimentacao</Button>
			<Button type="button" variant="outline" href="/equipment/{data.equipment.id}">
				Cancelar
			</Button>
		</div>
	</form>
</div>
