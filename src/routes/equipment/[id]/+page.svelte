<script lang="ts">
	import type { PageServerData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages.js';

	let { data }: { data: PageServerData } = $props();
</script>

<div class="container mx-auto p-4">
	<div class="flex justify-between items-center mb-4">
		<h1 class="text-2xl font-bold">{data.equipment.equipment.name}</h1>
		<div class="flex gap-2">
			<a href="/equipment/{data.equipment.equipment.id}/move">
				<Button variant="outline">{m.moveEquipment()}</Button>
			</a>
			<a href="/equipment/{data.equipment.equipment.id}/maintenance">
				<Button variant="outline">{m.registerMaintenance()}</Button>
			</a>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<Card.Root>
			<Card.Header>
				<Card.Title>{m.equipmentDetails()}</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-2">
					<p><strong>{m.equipmentCode()}:</strong> {data.equipment.equipment.code}</p>
					<p><strong>{m.equipmentName()}:</strong> {data.equipment.equipment.name}</p>
					{#if data.equipment.equipment.description}
						<p><strong>{m.equipmentDescription()}:</strong> {data.equipment.equipment.description}</p>
					{/if}
					{#if data.equipment.equipment.category}
						<p><strong>{m.equipmentCategory()}:</strong> {data.equipment.equipment.category}</p>
					{/if}
					{#if data.equipment.equipment.brand}
						<p><strong>{m.equipmentBrand()}:</strong> {data.equipment.equipment.brand}</p>
					{/if}
					{#if data.equipment.equipment.model}
						<p><strong>{m.equipmentModel()}:</strong> {data.equipment.equipment.model}</p>
					{/if}
					{#if data.equipment.equipment.serialNumber}
						<p><strong>{m.equipmentSerialNumber()}:</strong> {data.equipment.equipment.serialNumber}</p>
					{/if}
					<p><strong>{m.equipmentStatus()}:</strong> {data.equipment.equipment.status}</p>
					{#if data.equipment.currentLocation}
						<p><strong>{m.equipmentLocation()}:</strong> {data.equipment.currentLocation.name}</p>
					{/if}
					{#if data.equipment.currentUser}
						<p>
							<strong>{m.equipmentCurrentUser()}:</strong>
							{data.equipment.currentUser.name || data.equipment.currentUser.username}
						</p>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{m.movementHistory()}</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if data.movements && data.movements.length > 0}
					<div class="space-y-2">
						{#each data.movements as movementItem}
							<div class="border-b pb-2">
								<p class="text-sm">
									<strong>{m.movementStatus()}:</strong> {movementItem.movement.status}
								</p>
								<p class="text-sm">
									<strong>{m.requestedAt()}:</strong>
									{new Date(movementItem.movement.requestedAt).toLocaleDateString()}
								</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground">{m.noMovementsFound()}</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{m.maintenanceHistory()}</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if data.maintenances && data.maintenances.length > 0}
					<div class="space-y-2">
						{#each data.maintenances as maintenanceItem}
							<div class="border-b pb-2">
								<p class="text-sm">
									<strong>{m.maintenanceType()}:</strong> {maintenanceItem.maintenance.type}
								</p>
								<p class="text-sm">
									<strong>{m.maintenanceDescription()}:</strong>
									{maintenanceItem.maintenance.description}
								</p>
								<p class="text-sm">
									<strong>{m.maintenanceStatus()}:</strong> {maintenanceItem.maintenance.status}
								</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground">{m.noMaintenancesFound()}</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
