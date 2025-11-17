<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';

	export let data: PageData;
	export let form: any;
</script>

<div class="container mx-auto py-6 max-w-2xl">
	<Card>
		<CardHeader>
			<CardTitle>Novo Equipamento</CardTitle>
			<CardDescription>Preencha os dados do equipamento</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/createEquipment" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="code">Código *</Label>
						<Input id="code" name="code" required />
					</div>

					<div>
						<Label for="name">Nome *</Label>
						<Input id="name" name="name" required />
					</div>

					<div>
						<Label for="description">Descrição</Label>
						<Textarea id="description" name="description" />
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="category">Categoria</Label>
							<Input id="category" name="category" />
						</div>

						<div>
							<Label for="brand">Marca</Label>
							<Input id="brand" name="brand" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="model">Modelo</Label>
							<Input id="model" name="model" />
						</div>

						<div>
							<Label for="serialNumber">Número de Série</Label>
							<Input id="serialNumber" name="serialNumber" />
						</div>
					</div>

					<div>
						<Label for="status">Status</Label>
						<select id="status" name="status" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
							<option value="available">Disponível</option>
							<option value="in_use">Em Uso</option>
							<option value="maintenance">Manutenção</option>
							<option value="unavailable">Indisponível</option>
						</select>
					</div>

					<div>
						<Label for="currentLocationId">Localização</Label>
						<select id="currentLocationId" name="currentLocationId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
							<option value="">Nenhuma</option>
							{#each data.locations as location}
								<option value={location.id}>{location.name}</option>
							{/each}
						</select>
					</div>

					<div>
						<Label for="currentUserId">Responsável</Label>
						<select id="currentUserId" name="currentUserId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
							<option value="">Nenhum</option>
							{#each data.users as user}
								<option value={user.id}>{user.username}</option>
							{/each}
						</select>
					</div>

					<div class="flex gap-2 justify-end">
						<Button type="button" variant="outline" href="/equipment">Cancelar</Button>
						<Button type="submit">Criar</Button>
					</div>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
