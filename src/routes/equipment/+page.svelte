<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Plus } from 'lucide-svelte';
	import { Link } from '@sveltejs/kit';

	export let data: PageData;
</script>

<div class="container mx-auto py-6">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Equipamentos</h1>
			<p class="text-muted-foreground">Gerencie seus equipamentos</p>
		</div>
		{#if data.groups?.some((g) => g.isAdmin)}
			<Button asChild>
				<Link href="/equipment/create">
					<Plus class="mr-2 h-4 w-4" />
					Novo Equipamento
				</Link>
			</Button>
		{/if}
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.equipmentList as item}
			<Card>
				<CardHeader>
					<CardTitle>{item.equipment.name}</CardTitle>
					<CardDescription>Código: {item.equipment.code}</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-2">
						<div>
							<span class="text-sm font-medium">Status: </span>
							<span class="text-sm">{item.equipment.status}</span>
						</div>
						{#if item.location}
							<div>
								<span class="text-sm font-medium">Local: </span>
								<span class="text-sm">{item.location.name}</span>
							</div>
						{/if}
						{#if item.user}
							<div>
								<span class="text-sm font-medium">Responsável: </span>
								<span class="text-sm">{item.user.username}</span>
							</div>
						{/if}
						<div class="pt-2">
							<Button asChild variant="outline" size="sm">
								<Link href="/equipment/{item.equipment.id}">Ver Detalhes</Link>
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	{#if data.equipmentList.length === 0}
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-muted-foreground">Nenhum equipamento cadastrado</p>
			</CardContent>
		</Card>
	{/if}
</div>
