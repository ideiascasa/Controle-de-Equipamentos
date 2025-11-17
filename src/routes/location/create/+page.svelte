<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';

	let { form }: { form?: any } = $props();

	let isActive = $state(true);
</script>

<div class="container mx-auto max-w-2xl p-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Nova Localizacao</Card.Title>
			<Card.Description>Preencha os dados da localizacao</Card.Description>
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
						<Label for="address">Endereco</Label>
						<Input id="address" name="address" />
					</div>

					<div class="grid grid-cols-3 gap-4">
						<div>
							<Label for="building">Edificio</Label>
							<Input id="building" name="building" />
						</div>
						<div>
							<Label for="floor">Andar</Label>
							<Input id="floor" name="floor" />
						</div>
						<div>
							<Label for="room">Sala</Label>
							<Input id="room" name="room" />
						</div>
					</div>

					<div class="flex items-center gap-2">
						<Checkbox id="isActive" bind:checked={isActive} />
						<Label for="isActive" class="cursor-pointer">Localizacao Ativa</Label>
						<input type="hidden" name="isActive" value={isActive ? 'true' : 'false'} />
					</div>

					{#if form && form.message}
						<div class="rounded-md bg-red-100 p-3 text-sm text-red-800">
							{form.message}
						</div>
					{/if}

					<div class="flex gap-2">
						<Button type="submit">Criar Localizacao</Button>
						<a href="/location">
							<Button type="button" variant="outline">Cancelar</Button>
						</a>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
