<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';

	let { data, form }: { data: PageData; form?: any } = $props();
</script>

<div class="container mx-auto max-w-2xl p-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Novo Equipamento</Card.Title>
			<Card.Description>Preencha os dados do equipamento</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="name">Nome *</Label>
						<Input id="name" name="name" required />
					</div>

					<div>
						<Label for="description">Descricao</Label>
						<Textarea id="description" name="description" rows="3" />
					</div>

					<div>
						<Label for="serialNumber">Numero de Serie</Label>
						<Input id="serialNumber" name="serialNumber" />
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="model">Modelo</Label>
							<Input id="model" name="model" />
						</div>
						<div>
							<Label for="manufacturer">Fabricante</Label>
							<Input id="manufacturer" name="manufacturer" />
						</div>
					</div>

					<div>
						<Label for="category">Categoria</Label>
						<Input id="category" name="category" />
					</div>

					<div>
						<Label for="status">Status</Label>
						<Select.Root name="status" value="available">
							<Select.Trigger>
								<Select.Value placeholder="Selecione o status" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="available">Disponivel</Select.Item>
								<Select.Item value="allocated">Alocado</Select.Item>
								<Select.Item value="maintenance">Em Manutencao</Select.Item>
								<Select.Item value="retired">Aposentado</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<Label for="currentLocationId">Localizacao Atual</Label>
						<Select.Root name="currentLocationId">
							<Select.Trigger>
								<Select.Value placeholder="Selecione a localizacao" />
							</Select.Trigger>
							<Select.Content>
								{#each data.locations as location}
									<Select.Item value={location.id}>{location.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="purchaseDate">Data de Compra</Label>
							<Input id="purchaseDate" name="purchaseDate" type="date" />
						</div>
						<div>
							<Label for="purchaseValue">Valor de Compra (R$)</Label>
							<Input id="purchaseValue" name="purchaseValue" type="number" step="0.01" />
						</div>
					</div>

					<div>
						<Label for="warrantyExpiry">Data de Expiracao da Garantia</Label>
						<Input id="warrantyExpiry" name="warrantyExpiry" type="date" />
					</div>

					{#if form && form.message}
						<div class="rounded-md bg-red-100 p-3 text-sm text-red-800">
							{form.message}
						</div>
					{/if}

					<div class="flex gap-2">
						<Button type="submit">Criar Equipamento</Button>
						<a href="/equipment">
							<Button type="button" variant="outline">Cancelar</Button>
						</a>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
