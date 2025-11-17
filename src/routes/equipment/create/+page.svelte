<script lang="ts">
	import type { PageServerData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageServerData; form?: any } = $props();
</script>

<div class="container mx-auto p-4 max-w-2xl">
	<Card.Root>
		<Card.Header>
			<Card.Title>{m.createEquipment()}</Card.Title>
			<Card.Description>{m.createEquipmentDescription()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/createEquipment" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="code">{m.equipmentCode()} *</Label>
						<Input id="code" name="code" required />
						{#if form?.message === 'CODE_ALREADY_EXISTS'}
							<p class="text-sm text-destructive mt-1">{m.equipmentCodeExists()}</p>
						{/if}
					</div>

					<div>
						<Label for="name">{m.equipmentName()} *</Label>
						<Input id="name" name="name" required />
					</div>

					<div>
						<Label for="description">{m.equipmentDescription()}</Label>
						<Textarea id="description" name="description" />
					</div>

					<div>
						<Label for="category">{m.equipmentCategory()}</Label>
						<Input id="category" name="category" />
					</div>

					<div>
						<Label for="brand">{m.equipmentBrand()}</Label>
						<Input id="brand" name="brand" />
					</div>

					<div>
						<Label for="model">{m.equipmentModel()}</Label>
						<Input id="model" name="model" />
					</div>

					<div>
						<Label for="serialNumber">{m.equipmentSerialNumber()}</Label>
						<Input id="serialNumber" name="serialNumber" />
					</div>

					<div>
						<Label for="status">{m.equipmentStatus()}</Label>
						<select id="status" name="status" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
							<option value="available">{m.statusAvailable()}</option>
							<option value="in_use">{m.statusInUse()}</option>
							<option value="maintenance">{m.statusMaintenance()}</option>
							<option value="unavailable">{m.statusUnavailable()}</option>
						</select>
					</div>

					<div>
						<Label for="currentLocationId">{m.equipmentLocation()}</Label>
						<select id="currentLocationId" name="currentLocationId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
							<option value="">{m.selectLocation()}</option>
							{#each data.locations || [] as location}
								<option value={location.id}>{location.name}</option>
							{/each}
						</select>
					</div>

					<div class="flex gap-2">
						<Button type="submit">{m.create()}</Button>
						<a href="/equipment">
							<Button type="button" variant="outline">{m.cancel()}</Button>
						</a>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
