<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import ArrowLeftIcon from '@tabler/icons-svelte/icons/arrow-left';
	import { Link } from '@sveltejs/kit';

	let { data, form }: { data: PageData; form?: any } = $props();
</script>

<div class="container mx-auto p-6 max-w-2xl">
	<Link href="/equipment/{data.equipment.id}" class="inline-flex items-center text-sm text-muted-foreground mb-4">
		<ArrowLeftIcon class="mr-2 h-4 w-4" />
		{m.equipmentBackToDetails()}
	</Link>

	<Card.Root>
		<Card.Header>
			<Card.Title>{m.equipmentMaintenance()}</Card.Title>
			<Card.Description>{m.equipmentMaintenanceDescription()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance>
				<div class="space-y-4">
					<div>
						<Label>{m.equipmentEquipment()}</Label>
						<p class="text-sm text-muted-foreground">{data.equipment.name}</p>
					</div>

					<div>
						<Label for="maintenanceType">{m.equipmentMaintenanceType()}</Label>
						<Select.Root name="maintenanceType">
							<Select.Trigger>
								<Select.Value placeholder={m.equipmentSelectMaintenanceType()} />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="preventive">{m.equipmentMaintenancePreventive()}</Select.Item>
								<Select.Item value="corrective">{m.equipmentMaintenanceCorrective()}</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<Label for="description">{m.equipmentDescription()} *</Label>
						<Textarea id="description" name="description" required />
					</div>

					<div>
						<Label for="status">{m.equipmentStatus()}</Label>
						<Select.Root name="status">
							<Select.Trigger>
								<Select.Value placeholder={m.equipmentSelectStatus()} />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="scheduled">{m.equipmentMaintenanceScheduled()}</Select.Item>
								<Select.Item value="in_progress">{m.equipmentMaintenanceInProgress()}</Select.Item>
								<Select.Item value="completed">{m.equipmentMaintenanceCompleted()}</Select.Item>
								<Select.Item value="cancelled">{m.equipmentMaintenanceCancelled()}</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<Label for="scheduledDate">{m.equipmentScheduledDate()}</Label>
						<Input id="scheduledDate" name="scheduledDate" type="date" />
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="cost">{m.equipmentCost()}</Label>
							<Input id="cost" name="cost" type="number" step="0.01" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="technicianName">{m.equipmentTechnicianName()}</Label>
							<Input id="technicianName" name="technicianName" />
						</div>

						<div>
							<Label for="technicianContact">{m.equipmentTechnicianContact()}</Label>
							<Input id="technicianContact" name="technicianContact" />
						</div>
					</div>

					<div>
						<Label for="notes">{m.equipmentNotes()}</Label>
						<Textarea id="notes" name="notes" />
					</div>

					{#if form?.error}
						<div class="text-sm text-destructive">{form.error}</div>
					{/if}

					<div class="flex justify-end gap-2">
						<Link href="/equipment/{data.equipment.id}">
							<Button type="button" variant="outline">{m.equipmentCancel()}</Button>
						</Link>
						<Button type="submit">{m.equipmentSave()}</Button>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
