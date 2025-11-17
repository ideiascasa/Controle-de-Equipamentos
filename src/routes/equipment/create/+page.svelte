<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';

	export let data: PageData;
	export let form;

	let submitting = false;
</script>

<svelte:head>
	<title>{m.equipmentCreate()}</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-2xl">
	<h1 class="text-3xl font-bold mb-6">{m.equipmentCreate()}</h1>

	<form method="POST" action="?/createEquipment" use:enhance={() => {
		submitting = true;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'redirect') {
				await update();
			} else if (result.type === 'success') {
				await goto('/equipment');
			}
		};
	}}>
		<div class="space-y-4">
			<div>
				<label for="name" class="block text-sm font-medium mb-1">
					{m.equipmentName()} <span class="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="name"
					name="name"
					required
					class="w-full border rounded px-3 py-2"
					value={form?.name || ''}
				/>
				{#if form?.error === 'NAME_REQUIRED'}
					<p class="text-red-500 text-sm mt-1">{m.equipmentNameRequired()}</p>
				{/if}
			</div>

			<div>
				<label for="description" class="block text-sm font-medium mb-1">
					{m.equipmentDescription()}
				</label>
				<textarea
					id="description"
					name="description"
					rows="3"
					class="w-full border rounded px-3 py-2"
				>{form?.description || ''}</textarea>
			</div>

			<div>
				<label for="serialNumber" class="block text-sm font-medium mb-1">
					{m.equipmentSerialNumber()}
				</label>
				<input
					type="text"
					id="serialNumber"
					name="serialNumber"
					class="w-full border rounded px-3 py-2"
					value={form?.serialNumber || ''}
				/>
				{#if form?.error === 'SERIAL_NUMBER_EXISTS'}
					<p class="text-red-500 text-sm mt-1">{m.equipmentSerialNumberExists()}</p>
				{/if}
			</div>

			<div>
				<label for="category" class="block text-sm font-medium mb-1">
					{m.equipmentCategory()}
				</label>
				<input
					type="text"
					id="category"
					name="category"
					class="w-full border rounded px-3 py-2"
					value={form?.category || ''}
					placeholder={m.equipmentCategoryPlaceholder()}
				/>
			</div>

			<div>
				<label for="status" class="block text-sm font-medium mb-1">
					{m.equipmentStatus()}
				</label>
				<select id="status" name="status" class="w-full border rounded px-3 py-2">
					<option value="available">{m.equipmentStatusAvailable()}</option>
					<option value="in_use">{m.equipmentStatusInUse()}</option>
					<option value="maintenance">{m.equipmentStatusMaintenance()}</option>
					<option value="retired">{m.equipmentStatusRetired()}</option>
				</select>
			</div>

			<div>
				<label for="currentLocationId" class="block text-sm font-medium mb-1">
					{m.equipmentLocation()}
				</label>
				<select id="currentLocationId" name="currentLocationId" class="w-full border rounded px-3 py-2">
					<option value="">{m.equipmentNoLocation()}</option>
					{#each data.locations as location}
						<option value={location.id}>{location.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="currentUserId" class="block text-sm font-medium mb-1">
					{m.equipmentCurrentUser()}
				</label>
				<select id="currentUserId" name="currentUserId" class="w-full border rounded px-3 py-2">
					<option value="">{m.equipmentNoUser()}</option>
					{#each data.users as user}
						<option value={user.id}>{user.name || user.username}</option>
					{/each}
				</select>
			</div>

			<div class="flex gap-4 pt-4">
				<button
					type="submit"
					disabled={submitting}
					class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
				>
					{submitting ? m.equipmentCreating() : m.equipmentCreate()}
				</button>
				<a
					href="/equipment"
					class="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300"
				>
					{m.equipmentCancel()}
				</a>
			</div>
		</div>
	</form>
</div>
