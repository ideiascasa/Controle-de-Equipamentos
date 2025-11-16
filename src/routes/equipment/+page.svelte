<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from 'lucide-svelte';
	import EquipmentCard from '$lib/components/equipment/EquipmentCard.svelte';
	import EquipmentList from '$lib/components/equipment/EquipmentList.svelte';

	export let data: PageData;
</script>

<div class="container mx-auto py-6">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Equipamentos</h1>
			<p class="text-muted-foreground mt-1">Gerencie seus equipamentos e movimentacoes</p>
		</div>
		{#if data.isAdmin}
			<a href="/equipment/create">
				<Button>
					<Plus class="mr-2 h-4 w-4" />
					Novo Equipamento
				</Button>
			</a>
		{/if}
	</div>

	<EquipmentList equipment={data.equipment} isAdmin={data.isAdmin} />
</div>
