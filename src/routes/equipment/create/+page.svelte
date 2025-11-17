<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { MenuBread } from '$lib/components/menu-bread.svelte';

	let { data, form }: { data: PageData; form?: any } = $props();

	let code = $state('');
	let name = $state('');
	let description = $state('');
	let category = $state('');
	let manufacturer = $state('');
	let model = $state('');
	let serialNumber = $state('');
	let acquisitionDate = $state('');
	let value = $state('');
	let status = $state('available');
	let currentLocation = $state('');
	let notes = $state('');

	function getErrorMessage(message: string | undefined): string | undefined {
		if (!message) return undefined;
		switch (message) {
			case 'CODE_REQUIRED':
				return 'Codigo e obrigatorio';
			case 'NAME_REQUIRED':
				return 'Nome e obrigatorio';
			case 'CODE_ALREADY_EXISTS':
				return 'Codigo ja existe';
			default:
				return message;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<MenuBread menu={data.menu} />

	<Card.Root>
		<Card.Header>
			<Card.Title>Novo Equipamento</Card.Title>
			<Card.Description>Cadastre um novo equipamento no sistema</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				action="?/createEquipment"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<div class="flex flex-col gap-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label for="code">Codigo *</Label>
							<Input id="code" name="code" bind:value={code} required />
							{#if form?.message && form.action === 'createEquipment'}
								<p class="text-sm text-destructive mt-1">{getErrorMessage(form.message)}</p>
							{/if}
						</div>
						<div>
							<Label for="name">Nome *</Label>
							<Input id="name" name="name" bind:value={name} required />
						</div>
					</div>

					<div>
						<Label for="description">Descricao</Label>
						<Textarea id="description" name="description" bind:value={description} />
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<Label for="category">Categoria</Label>
							<Input id="category" name="category" bind:value={category} />
						</div>
						<div>
							<Label for="manufacturer">Fabricante</Label>
							<Input id="manufacturer" name="manufacturer" bind:value={manufacturer} />
						</div>
						<div>
							<Label for="model">Modelo</Label>
							<Input id="model" name="model" bind:value={model} />
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<Label for="serialNumber">Numero de Serie</Label>
							<Input id="serialNumber" name="serialNumber" bind:value={serialNumber} />
						</div>
						<div>
							<Label for="acquisitionDate">Data de Aquisicao</Label>
							<Input
								id="acquisitionDate"
								name="acquisitionDate"
								type="date"
								bind:value={acquisitionDate}
							/>
						</div>
						<div>
							<Label for="value">Valor (R$)</Label>
							<Input id="value" name="value" type="number" step="0.01" bind:value={value} />
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label for="status">Status</Label>
							<Select.Root bind:selected={status}>
								<Select.Trigger id="status" name="status">
									<Select.Value />
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="available">Disponivel</Select.Item>
									<Select.Item value="allocated">Alocado</Select.Item>
									<Select.Item value="maintenance">Em Manutencao</Select.Item>
									<Select.Item value="unavailable">Indisponivel</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
						<div>
							<Label for="currentLocation">Localizacao Atual</Label>
							<Input id="currentLocation" name="currentLocation" bind:value={currentLocation} />
						</div>
					</div>

					<div>
						<Label for="notes">Observacoes</Label>
						<Textarea id="notes" name="notes" bind:value={notes} />
					</div>

					<div class="flex gap-2">
						<Button type="submit">Criar Equipamento</Button>
						<Button type="button" variant="outline" onclick={() => history.back()}>
							Cancelar
						</Button>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
