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
			<Card.Title>{m.registerMaintenance()}</Card.Title>
			<Card.Description>
				{m.registerMaintenanceDescription()} - {data.equipment.equipment.name} ({data.equipment.equipment.code})
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/registerMaintenance" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="type">{m.maintenanceType()} *</Label>
						<select id="type" name="type" required class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
							<option value="">{m.selectMaintenanceType()}</option>
							<option value="preventive">{m.maintenanceTypePreventive()}</option>
							<option value="corrective">{m.maintenanceTypeCorrective()}</option>
							<option value="calibration">{m.maintenanceTypeCalibration()}</option>
						</select>
					</div>

					<div>
						<Label for="description">{m.maintenanceDescription()} *</Label>
						<Textarea id="description" name="description" required />
					</div>

					<div>
						<Label for="provider">{m.maintenanceProvider()}</Label>
						<Input id="provider" name="provider" />
					</div>

					<div>
						<Label for="cost">{m.maintenanceCost()}</Label>
						<Input id="cost" name="cost" type="number" />
					</div>

					<div>
						<Label for="startDate">{m.maintenanceStartDate()} *</Label>
						<Input id="startDate" name="startDate" type="date" required />
					</div>

					<div>
						<Label for="endDate">{m.maintenanceEndDate()}</Label>
						<Input id="endDate" name="endDate" type="date" />
					</div>

					<div>
						<Label for="status">{m.maintenanceStatus()}</Label>
						<select id="status" name="status" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
							<option value="scheduled">{m.statusScheduled()}</option>
							<option value="in_progress">{m.statusInProgress()}</option>
							<option value="completed">{m.statusCompleted()}</option>
							<option value="cancelled">{m.statusCancelled()}</option>
						</select>
					</div>

					<div>
						<Label for="nextMaintenanceDate">{m.nextMaintenanceDate()}</Label>
						<Input id="nextMaintenanceDate" name="nextMaintenanceDate" type="date" />
					</div>

					<div>
						<Label for="notes">{m.notes()}</Label>
						<Textarea id="notes" name="notes" />
					</div>

					<div class="flex gap-2">
						<Button type="submit">{m.register()}</Button>
						<a href="/equipment/{data.equipment.equipment.id}">
							<Button type="button" variant="outline">{m.cancel()}</Button>
						</a>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
