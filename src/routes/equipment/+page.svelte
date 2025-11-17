<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';

	export let data: PageData;

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
	<title>{m.equipmentTitle()}</title>
</svelte:head>

<div class="container mx-auto p-6">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">{m.equipmentTitle()}</h1>
		<a
			href="/equipment/create"
			class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
		>
			{m.equipmentCreate()}
		</a>
	</div>

	<!-- Filters -->
	<div class="mb-4 flex gap-4">
		<select
			class="border rounded px-3 py-2"
			onchange={(e) => {
				const status = e.currentTarget.value;
				if (status) {
					goto(`/equipment?status=${status}`);
				} else {
					goto('/equipment');
				}
			}}
		>
			<option value="">{m.equipmentFilterAllStatuses()}</option>
			<option value="available" selected={data.statusFilter === 'available'}>
				{m.equipmentStatusAvailable()}
			</option>
			<option value="in_use" selected={data.statusFilter === 'in_use'}>
				{m.equipmentStatusInUse()}
			</option>
			<option value="maintenance" selected={data.statusFilter === 'maintenance'}>
				{m.equipmentStatusMaintenance()}
			</option>
			<option value="retired" selected={data.statusFilter === 'retired'}>
				{m.equipmentStatusRetired()}
			</option>
		</select>
	</div>

	<!-- Equipment List -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each data.equipmentList as equipment}
			<div class="border rounded-lg p-4 shadow hover:shadow-lg transition">
				<div class="flex justify-between items-start mb-2">
					<h3 class="text-xl font-semibold">
						<a href="/equipment/{equipment.id}" class="text-blue-600 hover:underline">
							{equipment.name}
						</a>
					</h3>
					<span class="px-2 py-1 rounded text-sm {getStatusColor(equipment.status)}">
						{getStatusLabel(equipment.status)}
					</span>
				</div>
				{#if equipment.description}
					<p class="text-gray-600 mb-2">{equipment.description}</p>
				{/if}
				{#if equipment.serialNumber}
					<p class="text-sm text-gray-500 mb-2">
						<strong>{m.equipmentSerialNumber()}:</strong> {equipment.serialNumber}
					</p>
				{/if}
				{#if equipment.category}
					<p class="text-sm text-gray-500 mb-2">
						<strong>{m.equipmentCategory()}:</strong> {equipment.category}
					</p>
				{/if}
				{#if equipment.currentLocation}
					<p class="text-sm text-gray-500 mb-2">
						<strong>{m.equipmentLocation()}:</strong> {equipment.currentLocation.name}
					</p>
				{/if}
				{#if equipment.currentUser}
					<p class="text-sm text-gray-500 mb-2">
						<strong>{m.equipmentCurrentUser()}:</strong> {equipment.currentUser.name ||
							equipment.currentUser.username}
					</p>
				{/if}
				<div class="flex gap-2 mt-4">
					<a
						href="/equipment/{equipment.id}"
						class="text-blue-600 hover:underline text-sm"
					>
						{m.equipmentViewDetails()}
					</a>
					{#if data.isAdministrator}
						<form
							method="POST"
							action="?/deleteEquipment"
							use:enhance
							class="inline"
						>
							<input type="hidden" name="equipmentId" value={equipment.id} />
							<button
								type="submit"
								class="text-red-600 hover:underline text-sm"
								onclick={(e) => {
									if (!confirm(m.equipmentDeleteConfirm())) {
										e.preventDefault();
									}
								}}
							>
								{m.equipmentDelete()}
							</button>
						</form>
					{/if}
				</div>
			</div>
		{:else}
			<div class="col-span-full text-center py-8 text-gray-500">
				{m.equipmentNoEquipmentFound()}
			</div>
		{/each}
	</div>
</div>
