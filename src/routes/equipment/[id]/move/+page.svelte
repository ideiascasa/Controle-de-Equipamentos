<script lang="ts">
	import type { PageServerData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageServerData; form?: any } = $props();
</script>

<div class="container mx-auto p-4 max-w-2xl">
	<Card.Root>
		<Card.Header>
			<Card.Title>{m.moveEquipment()}</Card.Title>
			<Card.Description>
				{m.moveEquipmentDescription()} - {data.equipment.equipment.name} ({data.equipment.equipment.code})
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/moveEquipment" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="toLocationId">{m.destinationLocation()}</Label>
						<select id="toLocationId" name="toLocationId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
							<option value="">{m.selectLocation()}</option>
							{#each data.locations || [] as location}
								<option value={location.id}>{location.name}</option>
							{/each}
						</select>
					</div>

					<div>
						<Label for="reason">{m.movementReason()}</Label>
						<Textarea id="reason" name="reason" />
					</div>

					<div>
						<Label for="notes">{m.notes()}</Label>
						<Textarea id="notes" name="notes" />
					</div>

					<div class="flex items-center space-x-2">
						<Checkbox id="requiresAuthorization" name="requiresAuthorization" value="true" />
						<Label for="requiresAuthorization">{m.requiresAuthorization()}</Label>
					</div>

					<div class="flex gap-2">
						<Button type="submit">{m.move()}</Button>
						<a href="/equipment/{data.equipment.equipment.id}">
							<Button type="button" variant="outline">{m.cancel()}</Button>
						</a>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
