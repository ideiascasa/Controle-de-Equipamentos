<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';
	import { Link } from '@sveltejs/kit';

	let { data, form }: { data: PageData; form?: any } = $props();
</script>

<div class="container mx-auto p-6 max-w-2xl">
	<Link href="/equipment" class="inline-flex items-center text-sm text-muted-foreground mb-4">
		<ArrowLeftIcon class="mr-2 h-4 w-4" />
		{m.equipmentBackToList()}
	</Link>

	<Card.Root>
		<Card.Header>
			<Card.Title>{m.equipmentCreate()}</Card.Title>
			<Card.Description>{m.equipmentCreateDescription()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="name">{m.equipmentName()} *</Label>
						<Input id="name" name="name" required />
					</div>

					<div>
						<Label for="description">{m.equipmentDescription()}</Label>
						<Textarea id="description" name="description" />
					</div>

					<div>
						<Label for="serialNumber">{m.equipmentSerialNumber()}</Label>
						<Input id="serialNumber" name="serialNumber" />
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="model">{m.equipmentModel()}</Label>
							<Input id="model" name="model" />
						</div>

						<div>
							<Label for="manufacturer">{m.equipmentManufacturer()}</Label>
							<Input id="manufacturer" name="manufacturer" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="category">{m.equipmentCategory()}</Label>
							<Input id="category" name="category" />
						</div>

						<div>
							<Label for="status">{m.equipmentStatus()}</Label>
							<Select.Root name="status">
								<Select.Trigger>
									<Select.Value placeholder={m.equipmentSelectStatus()} />
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="available">{m.equipmentStatusAvailable()}</Select.Item>
									<Select.Item value="in_use">{m.equipmentStatusInUse()}</Select.Item>
									<Select.Item value="maintenance">{m.equipmentStatusMaintenance()}</Select.Item>
									<Select.Item value="retired">{m.equipmentStatusRetired()}</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="purchaseDate">{m.equipmentPurchaseDate()}</Label>
							<Input id="purchaseDate" name="purchaseDate" type="date" />
						</div>

						<div>
							<Label for="purchaseValue">{m.equipmentPurchaseValue()}</Label>
							<Input id="purchaseValue" name="purchaseValue" type="number" step="0.01" />
						</div>
					</div>

					<div>
						<Label for="currentLocationId">{m.equipmentCurrentLocation()}</Label>
						<Select.Root name="currentLocationId">
							<Select.Trigger>
								<Select.Value placeholder={m.equipmentSelectLocation()} />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">{m.equipmentNoLocation()}</Select.Item>
								{#each data.locations || [] as location}
									<Select.Item value={location.id}>{location.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					{#if form?.error}
						<div class="text-sm text-destructive">{form.error}</div>
					{/if}

					<div class="flex justify-end gap-2">
						<Link href="/equipment">
							<Button type="button" variant="outline">{m.equipmentCancel()}</Button>
						</Link>
						<Button type="submit">{m.equipmentSave()}</Button>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
