<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import * as m from '$lib/paraglide/messages';

	export let data: PageData;

	let showMoveForm = false;
	let submitting = false;

	function getStatusColor(status: string): string {
		switch (status) {
			case 'available':
				return 'bg-green-100 text-green-800';
			case 'in_use':
				return 'bg-blue-100 text-blue-800';
			case 'maintenance':
				return 'bg-yellow-100 text-yellow-800';
			case 'retired':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'available':
				return m.equipmentStatusAvailable();
			case 'in_use':
				return m.equipmentStatusInUse();
			case 'maintenance':
				return m.equipmentStatusMaintenance();
			case 'retired':
				return m.equipmentStatusRetired();
			default:
				return status;
		}
	}
</script>

<svelte:head>
	<title>{data.equipment.name}</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-4xl">
	<div class="flex justify-between items-start mb-6">
		<div>
			<h1 class="text-3xl font-bold">{data.equipment.name}</h1>
			<span class="px-3 py-1 rounded text-sm mt-2 inline-block {getStatusColor(data.equipment.status)}">
				{getStatusLabel(data.equipment.status)}
			</span>
		</div>
		<a href="/equipment" class="text-blue-600 hover:underline">
			← {m.equipmentBackToList()}
		</a>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
		<div class="border rounded-lg p-4">
			<h2 class="text-xl font-semibold mb-4">{m.equipmentDetails()}</h2>
			<div class="space-y-2">
				{#if data.equipment.description}
					<p><strong>{m.equipmentDescription()}:</strong> {data.equipment.description}</p>
				{/if}
				{#if data.equipment.serialNumber}
					<p><strong>{m.equipmentSerialNumber()}:</strong> {data.equipment.serialNumber}</p>
				{/if}
				{#if data.equipment.category}
					<p><strong>{m.equipmentCategory()}:</strong> {data.equipment.category}</p>
				{/if}
				{#if data.currentLocation}
					<p><strong>{m.equipmentLocation()}:</strong> {data.currentLocation.name}</p>
				{/if}
				{#if data.currentUser}
					<p>
						<strong>{m.equipmentCurrentUser()}:</strong> {data.currentUser.name ||
							data.currentUser.username}
					</p>
				{/if}
				<p><strong>{m.equipmentCreatedAt()}:</strong> {new Date(data.equipment.createdAt).toLocaleString()}</p>
			</div>
		</div>

		<div class="border rounded-lg p-4">
			<h2 class="text-xl font-semibold mb-4">{m.equipmentActions()}</h2>
			<div class="space-y-2">
				<button
					onclick={() => (showMoveForm = !showMoveForm)}
					class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
				>
					{m.equipmentMove()}
				</button>
				<a
					href="/equipment/maintenance/create?equipmentId={data.equipment.id}"
					class="block w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-center"
				>
					{m.equipmentCreateMaintenance()}
				</a>
			</div>
		</div>
	</div>

	{#if showMoveForm}
		<div class="border rounded-lg p-4 mb-6">
			<h2 class="text-xl font-semibold mb-4">{m.equipmentMove()}</h2>
			<form method="POST" action="?/moveEquipment" use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					submitting = false;
					if (result.type === 'success') {
						showMoveForm = false;
						await update();
					}
				};
			}}>
				<div class="space-y-4">
					<div>
						<label for="toLocationId" class="block text-sm font-medium mb-1">
							{m.equipmentNewLocation()}
						</label>
						<select id="toLocationId" name="toLocationId" class="w-full border rounded px-3 py-2">
							<option value="">{m.equipmentNoLocation()}</option>
							{#each data.locations as location}
								<option value={location.id}>{location.name}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="toUserId" class="block text-sm font-medium mb-1">
							{m.equipmentNewUser()}
						</label>
						<select id="toUserId" name="toUserId" class="w-full border rounded px-3 py-2">
							<option value="">{m.equipmentNoUser()}</option>
							{#each data.users as user}
								<option value={user.id}>{user.name || user.username}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="reason" class="block text-sm font-medium mb-1">
							{m.equipmentMoveReason()}
						</label>
						<input
							type="text"
							id="reason"
							name="reason"
							class="w-full border rounded px-3 py-2"
						/>
					</div>

					<div>
						<label for="notes" class="block text-sm font-medium mb-1">
							{m.equipmentNotes()}
						</label>
						<textarea id="notes" name="notes" rows="3" class="w-full border rounded px-3 py-2"></textarea>
					</div>

					<div class="flex gap-4">
						<button
							type="submit"
							disabled={submitting}
							class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
						>
							{submitting ? m.equipmentMoving() : m.equipmentMove()}
						</button>
						<button
							type="button"
							onclick={() => (showMoveForm = false)}
							class="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300"
						>
							{m.equipmentCancel()}
						</button>
					</div>
				</div>
			</form>
		</div>
	{/if}

	<div class="border rounded-lg p-4 mb-6">
		<h2 class="text-xl font-semibold mb-4">{m.equipmentMovementHistory()}</h2>
		{#if data.movements.length > 0}
			<div class="space-y-2">
				{#each data.movements as movement}
					<div class="border-b pb-2">
						<p class="text-sm text-gray-600">
							{new Date(movement.createdAt).toLocaleString()}
						</p>
						{#if movement.reason}
							<p><strong>{m.equipmentMoveReason()}:</strong> {movement.reason}</p>
						{/if}
						{#if movement.notes}
							<p class="text-sm text-gray-600">{movement.notes}</p>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-gray-500">{m.equipmentNoMovements()}</p>
		{/if}
	</div>

	<div class="border rounded-lg p-4">
		<h2 class="text-xl font-semibold mb-4">{m.equipmentMaintenanceHistory()}</h2>
		{#if data.maintenances.length > 0}
			<div class="space-y-2">
				{#each data.maintenances as maintenance}
					<div class="border-b pb-2">
						<p class="font-semibold">{maintenance.description}</p>
						<p class="text-sm text-gray-600">
							{maintenance.maintenanceType} - {maintenance.status} - {new Date(maintenance.createdAt).toLocaleString()}
						</p>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-gray-500">{m.equipmentNoMaintenances()}</p>
		{/if}
	</div>
</div>
