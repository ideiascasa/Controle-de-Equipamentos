<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages.js';

	let { data, form }: { data: PageData; form?: any } = $props();
</script>

<div class="container mx-auto py-6 max-w-2xl">
	<h1 class="text-3xl font-bold mb-6">Mover Equipamento: {data.equipment.name}</h1>

	<Card.Root>
		<Card.Header>
			<Card.Title>Informacoes de Movimentacao</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="toLocationId">Localizacao de Destino *</Label>
						<Select.Root name="toLocationId" required>
							<Select.Trigger>
								<Select.Value placeholder="Selecione a localizacao de destino" />
							</Select.Trigger>
							<Select.Content>
								{#each data.locations as location}
									<Select.Item value={location.id}>{location.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					{#if data.users && data.users.length > 0}
						<div>
							<Label for="toUserId">Usuario de Destino</Label>
							<Select.Root name="toUserId">
								<Select.Trigger>
									<Select.Value placeholder="Selecione o usuario (opcional)" />
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

						<div>
							<Label for="authorizedById">Autorizado por</Label>
							<Select.Root name="authorizedById">
								<Select.Trigger>
									<Select.Value placeholder="Selecione o autorizador (opcional)" />
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

					<div>
						<Label for="reason">Motivo da Movimentacao</Label>
						<Textarea id="reason" name="reason" />
					</div>

					<div class="flex gap-2">
						<Button type="submit">Mover Equipamento</Button>
						<a href="/equipment/{data.equipment.id}">
							<Button type="button" variant="outline">Cancelar</Button>
						</a>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
