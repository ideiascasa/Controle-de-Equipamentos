<script lang="ts">
	import EquipmentCard from './EquipmentCard.svelte';

	interface Equipment {
		id: string;
		name: string;
		description?: string | null;
		serialNumber?: string | null;
		category?: string | null;
		status?: string | null;
		currentLocation?: string | null;
		currentUserId?: string | null;
		currentUserName?: string | null;
		currentUserUsername?: string | null;
		groupId?: string | null;
		groupName?: string | null;
		imageUrl?: string | null;
		createdAt?: Date | null;
	}

	const { equipment = [], isAdmin = false } = $props<{
		equipment: Equipment[];
		isAdmin?: boolean;
	}>();
</script>

{#if equipment.length === 0}
	<div class="text-center py-12">
		<p class="text-muted-foreground">Nenhum equipamento encontrado.</p>
	</div>
{:else}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each equipment as item (item.id)}
			<EquipmentCard {equipment}={item} {isAdmin} />
		{/each}
	</div>
{/if}
