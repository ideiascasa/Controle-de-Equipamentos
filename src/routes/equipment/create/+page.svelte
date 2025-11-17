<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages.js';

	let { data, form }: { data: PageData; form?: any } = $props();
</script>

<div class="container mx-auto py-6 max-w-2xl">
	<h1 class="text-3xl font-bold mb-6">Cadastrar Equipamento</h1>

	<Card.Root>
		<Card.Header>
			<Card.Title>Informacoes do Equipamento</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="name">Nome *</Label>
						<Input id="name" name="name" required />
					</div>

					<div>
						<Label for="description">Descricao</Label>
						<Textarea id="description" name="description" />
					</div>

					<div>
						<Label for="serialNumber">Numero de Serie</Label>
						<Input id="serialNumber" name="serialNumber" />
					</div>

					<div>
						<Label for="category">Categoria</Label>
						<Input id="category" name="category" />
					</div>

					<div>
						<Label for="status">Status</Label>
						<Select.Root name="status">
							<Select.Trigger>
								<Select.Value placeholder="Selecione o status" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="available">Disponivel</Select.Item>
								<Select.Item value="allocated">Alocado</Select.Item>
								<Select.Item value="maintenance">Em Manutencao</Select.Item>
								<Select.Item value="retired">Desativado</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					{#if data.locations && data.locations.length > 0}
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
					{/if}

					{#if data.users && data.users.length > 0}
						<div>
							<Label for="currentUserId">Usuario Atual</Label>
							<Select.Root name="currentUserId">
								<Select.Trigger>
									<Select.Value placeholder="Selecione o usuario" />
								</Select.Trigger>
								<Select.Content>
									{#each data.users as user}
										<Select.Item value={user.id}>
											{user.name || user.username}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					{/if}

					<div class="flex gap-2">
						<Button type="submit">Cadastrar</Button>
						<a href="/equipment">
							<Button type="button" variant="outline">Cancelar</Button>
						</a>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
