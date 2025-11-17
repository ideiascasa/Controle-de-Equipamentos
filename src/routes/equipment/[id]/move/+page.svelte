<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Link } from '@sveltejs/kit';
	import { ArrowLeft } from 'lucide-svelte';

	export let data: PageData;
	export let form: any;
</script>

<div class="container mx-auto py-6 max-w-2xl">
	<div class="mb-6">
		<Button asChild variant="ghost" class="mb-4">
			<Link href="/equipment/{data.equipment.id}">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Voltar
			</Link>
		</Button>
		<h1 class="text-3xl font-bold">Movimentar Equipamento</h1>
		<p class="text-muted-foreground">{data.equipment.name} - {data.equipment.code}</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Nova Movimentação</CardTitle>
			<CardDescription>Registre a movimentação do equipamento</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/moveEquipment" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="toLocationId">Localização Destino</Label>
						<select id="toLocationId" name="toLocationId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
							<option value="">Nenhuma</option>
							{#each data.locations as location}
								<option value={location.id}>{location.name}</option>
							{/each}
						</select>
					</div>

					<div>
						<Label for="toUserId">Responsável Destino</Label>
						<select id="toUserId" name="toUserId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
							<option value="">Nenhum</option>
							{#each data.users as user}
								<option value={user.id}>{user.username}</option>
							{/each}
						</select>
					</div>

					<div>
						<Label for="reason">Motivo</Label>
						<Input id="reason" name="reason" />
					</div>

					<div>
						<Label for="notes">Observações</Label>
						<Textarea id="notes" name="notes" />
					</div>

					<div class="flex gap-2 justify-end">
						<Button type="button" variant="outline" href="/equipment/{data.equipment.id}">Cancelar</Button>
						<Button type="submit">Movimentar</Button>
					</div>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
