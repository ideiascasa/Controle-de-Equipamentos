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

	let equipmentId = $state('');
	let toLocation = $state('');
	let notes = $state('');
</script>

<div class="container mx-auto py-6 max-w-2xl">
	<Card.Root>
		<Card.Header>
			<Card.Title>Nova Movimentacao</Card.Title>
			<Card.Description>Preencha os dados da movimentacao</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="equipmentId">Equipamento *</Label>
						<Select.Root bind:selected={equipmentId} name="equipmentId" required>
							<Select.Trigger>
								<Select.Value placeholder="Selecione o equipamento" />
							</Select.Trigger>
							<Select.Content>
								{#each data.equipment as eq}
									<Select.Item value={eq.id}>
										{eq.name} ({eq.status === 'available' ? 'Disponivel' : 'Alocado'})
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<Label for="toLocation">Localizacao Destino *</Label>
						<Input id="toLocation" name="toLocation" bind:value={toLocation} required />
					</div>

					<div>
						<Label for="notes">Observacoes</Label>
						<Textarea id="notes" name="notes" bind:value={notes} />
					</div>

					<div class="flex gap-2 justify-end pt-4">
						<a href="/equipment/movements">
							<Button type="button" variant="outline">Cancelar</Button>
						</a>
						<Button type="submit">Criar Movimentacao</Button>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
