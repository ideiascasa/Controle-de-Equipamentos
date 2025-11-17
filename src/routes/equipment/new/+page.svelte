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

	let currentLocationId = $state('');
	let currentUserId = $state('');
</script>

<svelte:head>
	<title>Novo Equipamento</title>
</svelte:head>

<div class="container mx-auto py-6 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">Novo Equipamento</h1>
		<p class="text-muted-foreground">Cadastre um novo equipamento no sistema</p>
	</div>

	<form method="POST" action="?/createEquipment" use:enhance>
		<Card.Root class="p-6 space-y-6">
			<Card.Header>
				<Card.Title>Informacoes Basicas</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Label for="code">Codigo *</Label>
						<Input
							id="code"
							name="code"
							required
							placeholder="Ex: EQ-001"
							value={form?.code || ''}
						/>
						{#if form?.message === 'CODE_ALREADY_EXISTS'}
							<p class="text-sm text-destructive mt-1">Este codigo ja esta em uso</p>
						{/if}
					</div>
					<div>
						<Label for="name">Nome *</Label>
						<Input id="name" name="name" required placeholder="Nome do equipamento" />
					</div>
				</div>

				<div>
					<Label for="description">Descricao</Label>
					<Textarea id="description" name="description" placeholder="Descricao detalhada..." />
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<Label for="category">Categoria</Label>
						<Input id="category" name="category" placeholder="Ex: Informatica" />
					</div>
					<div>
						<Label for="brand">Marca</Label>
						<Input id="brand" name="brand" placeholder="Marca do equipamento" />
					</div>
					<div>
						<Label for="model">Modelo</Label>
						<Input id="model" name="model" placeholder="Modelo do equipamento" />
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Label for="serialNumber">Numero de Serie</Label>
						<Input id="serialNumber" name="serialNumber" placeholder="Numero de serie" />
					</div>
					<div>
						<Label for="patrimonyNumber">Numero de Patrimonio</Label>
						<Input id="patrimonyNumber" name="patrimonyNumber" placeholder="Numero de patrimonio" />
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="p-6 space-y-6 mt-6">
			<Card.Header>
				<Card.Title>Informacoes de Compra</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<Label for="purchaseDate">Data de Compra</Label>
						<Input id="purchaseDate" name="purchaseDate" type="date" />
					</div>
					<div>
						<Label for="purchaseValue">Valor de Compra</Label>
						<Input id="purchaseValue" name="purchaseValue" type="number" step="0.01" placeholder="0.00" />
					</div>
					<div>
						<Label for="warrantyExpiry">Fim da Garantia</Label>
						<Input id="warrantyExpiry" name="warrantyExpiry" type="date" />
					</div>
				</div>

				<div>
					<Label for="supplier">Fornecedor</Label>
					<Input id="supplier" name="supplier" placeholder="Nome do fornecedor" />
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="p-6 space-y-6 mt-6">
			<Card.Header>
				<Card.Title>Localizacao e Responsavel</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Label for="currentLocationId">Localizacao Atual</Label>
						<Select.Root bind:selected={currentLocationId}>
							<Select.Trigger id="currentLocationId" name="currentLocationId">
								<Select.Value placeholder="Selecione uma localizacao" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">Nenhuma</Select.Item>
								{#each data.locations || [] as location}
									<Select.Item value={location.id}>{location.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div>
						<Label for="currentUserId">Usuario Responsavel</Label>
						<Select.Root bind:selected={currentUserId}>
							<Select.Trigger id="currentUserId" name="currentUserId">
								<Select.Value placeholder="Selecione um usuario" />
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
				</div>

				<div>
					<Label for="notes">Observacoes</Label>
					<Textarea id="notes" name="notes" placeholder="Observacoes adicionais..." />
				</div>
			</Card.Content>
		</Card.Root>

		<div class="flex gap-4 mt-6">
			<Button type="submit">Criar Equipamento</Button>
			<Button type="button" variant="outline" href="/equipment">Cancelar</Button>
		</div>
	</form>
</div>
