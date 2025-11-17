<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Link } from '@sveltejs/kit';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';
	import PackageIcon from '@tabler/icons-svelte/icons/package';
	import MapPinIcon from '@tabler/icons-svelte/icons/map-pin';
	import UserIcon from '@tabler/icons-svelte/icons/user';
	import HistoryIcon from '@tabler/icons-svelte/icons/history';
	import ToolsIcon from '@tabler/icons-svelte/icons/tools';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto p-6 max-w-4xl">
	<Link href="/equipment" class="inline-flex items-center text-sm text-muted-foreground mb-4">
		<ArrowLeftIcon class="mr-2 h-4 w-4" />
		{m.equipmentBackToList()}
	</Link>

	<Card.Root class="mb-6">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<PackageIcon class="h-5 w-5" />
				{data.equipment.name}
			</Card.Title>
			<Card.Description>{data.equipment.description || m.equipmentNoDescription()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#if data.equipment.serialNumber}
					<div>
						<p class="text-sm font-semibold">{m.equipmentSerialNumber()}</p>
						<p class="text-sm text-muted-foreground">{data.equipment.serialNumber}</p>
					</div>
				{/if}

				{#if data.equipment.model}
					<div>
						<p class="text-sm font-semibold">{m.equipmentModel()}</p>
						<p class="text-sm text-muted-foreground">{data.equipment.model}</p>
					</div>
				{/if}

				{#if data.equipment.manufacturer}
					<div>
						<p class="text-sm font-semibold">{m.equipmentManufacturer()}</p>
						<p class="text-sm text-muted-foreground">{data.equipment.manufacturer}</p>
					</div>
				{/if}

				{#if data.equipment.category}
					<div>
						<p class="text-sm font-semibold">{m.equipmentCategory()}</p>
						<p class="text-sm text-muted-foreground">{data.equipment.category}</p>
					</div>
				{/if}

				<div>
					<p class="text-sm font-semibold">{m.equipmentStatus()}</p>
					<p class="text-sm text-muted-foreground">{data.equipment.status}</p>
				</div>

				{#if data.currentLocation}
					<div>
						<p class="text-sm font-semibold flex items-center gap-1">
							<MapPinIcon class="h-4 w-4" />
							{m.equipmentCurrentLocation()}
						</p>
						<p class="text-sm text-muted-foreground">{data.currentLocation.name}</p>
					</div>
				{/if}

				{#if data.currentUser}
					<div>
						<p class="text-sm font-semibold flex items-center gap-1">
							<UserIcon class="h-4 w-4" />
							{m.equipmentCurrentUser()}
						</p>
						<p class="text-sm text-muted-foreground">{data.currentUser.name || data.currentUser.username}</p>
					</div>
				{/if}
			</div>
		</Card.Content>
		<Card.Footer class="flex gap-2">
			<Link href="/equipment/{data.equipment.id}/movement">
				<Button variant="outline">{m.equipmentMove()}</Button>
			</Link>
			<Link href="/equipment/{data.equipment.id}/maintenance">
				<Button variant="outline">{m.equipmentMaintenance()}</Button>
			</Link>
		</Card.Footer>
	</Card.Root>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<HistoryIcon class="h-5 w-5" />
					{m.equipmentMovementHistory()}
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if data.movements && data.movements.length > 0}
					<div class="space-y-2">
						{#each data.movements as movement}
							<div class="border-b pb-2">
								<p class="text-sm font-semibold">{movement.status}</p>
								<p class="text-xs text-muted-foreground">
									{m.equipmentRequestedBy()}: {movement.requestedById}
								</p>
								{#if movement.authorizedById}
									<p class="text-xs text-muted-foreground">
										{m.equipmentAuthorizedBy()}: {movement.authorizedById}
									</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">{m.equipmentNoMovements()}</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<ToolsIcon class="h-5 w-5" />
					{m.equipmentMaintenanceHistory()}
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if data.maintenances && data.maintenances.length > 0}
					<div class="space-y-2">
						{#each data.maintenances as maintenance}
							<div class="border-b pb-2">
								<p class="text-sm font-semibold">{maintenance.maintenanceType} - {maintenance.status}</p>
								<p class="text-xs text-muted-foreground">{maintenance.description}</p>
								{#if maintenance.scheduledDate}
									<p class="text-xs text-muted-foreground">
										{m.equipmentScheduledDate()}: {new Date(maintenance.scheduledDate).toLocaleDateString()}
									</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">{m.equipmentNoMaintenances()}</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
