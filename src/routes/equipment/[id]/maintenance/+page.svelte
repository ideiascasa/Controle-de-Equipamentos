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
	<h1 class="text-3xl font-bold mb-6">Registrar Manutencao: {data.equipment.name}</h1>

	<Card.Root>
		<Card.Header>
			<Card.Title>Informacoes da Manutencao</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="maintenanceType">Tipo de Manutencao *</Label>
						<Select.Root name="maintenanceType" required>
							<Select.Trigger>
								<Select.Value placeholder="Selecione o tipo" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="preventive">Preventiva</Select.Item>
								<Select.Item value="corrective">Corretiva</Select.Item>
								<Select.Item value="upgrade">Atualizacao</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<Label for="description">Descricao *</Label>
						<Textarea id="description" name="description" required />
					</div>

					<div>
						<Label for="cost">Custo (em centavos)</Label>
						<Input id="cost" name="cost" type="number" />
					</div>

					{#if data.users && data.users.length > 0}
						<div>
							<Label for="performedById">Realizado por</Label>
							<Select.Root name="performedById">
								<Select.Trigger>
									<Select.Value placeholder="Selecione o tecnico (opcional)" />
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
						<Label for="startDate">Data de Inicio</Label>
						<Input id="startDate" name="startDate" type="datetime-local" />
					</div>

					<div>
						<Label for="endDate">Data de Fim</Label>
						<Input id="endDate" name="endDate" type="datetime-local" />
					</div>

					<div>
						<Label for="status">Status</Label>
						<Select.Root name="status">
							<Select.Trigger>
								<Select.Value placeholder="Selecione o status" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="scheduled">Agendada</Select.Item>
								<Select.Item value="in_progress">Em Andamento</Select.Item>
								<Select.Item value="completed">Concluida</Select.Item>
								<Select.Item value="cancelled">Cancelada</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div class="flex gap-2">
						<Button type="submit">Registrar Manutencao</Button>
						<a href="/equipment/{data.equipment.id}">
							<Button type="button" variant="outline">Cancelar</Button>
						</a>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
