<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';

	export let data: PageData;
	export let form: any;

	let name = $state('');
	let description = $state('');
	let serialNumber = $state('');
	let category = $state('');
	let status = $state('available');
	let currentLocation = $state('');
	let groupId = $state('');
</script>

<div class="container mx-auto py-6 max-w-2xl">
	<Card.Root>
		<Card.Header>
			<Card.Title>Novo Equipamento</Card.Title>
			<Card.Description>Preencha os dados do equipamento</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="name">Nome *</Label>
						<Input id="name" name="name" bind:value={name} required />
					</div>

					<div>
						<Label for="description">Descricao</Label>
						<Textarea id="description" name="description" bind:value={description} />
					</div>

					<div>
						<Label for="serialNumber">Numero de Serie</Label>
						<Input id="serialNumber" name="serialNumber" bind:value={serialNumber} />
					</div>

					<div>
						<Label for="category">Categoria</Label>
						<Input id="category" name="category" bind:value={category} />
					</div>

					<div>
						<Label for="status">Status</Label>
						<Select.Root bind:selected={status} name="status">
							<Select.Trigger>
								<Select.Value placeholder="Selecione o status" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="available">Disponivel</Select.Item>
								<Select.Item value="allocated">Alocado</Select.Item>
								<Select.Item value="maintenance">Manutencao</Select.Item>
								<Select.Item value="retired">Desativado</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<Label for="currentLocation">Localizacao Atual</Label>
						<Input id="currentLocation" name="currentLocation" bind:value={currentLocation} />
					</div>

					<div>
						<Label for="groupId">Grupo</Label>
						<Select.Root bind:selected={groupId} name="groupId">
							<Select.Trigger>
								<Select.Value placeholder="Selecione um grupo" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">Nenhum</Select.Item>
								{#each data.groups as group}
									<Select.Item value={group.id}>{group.name || group.id}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="flex gap-2 justify-end pt-4">
						<a href="/equipment">
							<Button type="button" variant="outline">Cancelar</Button>
						</a>
						<Button type="submit">Criar Equipamento</Button>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
