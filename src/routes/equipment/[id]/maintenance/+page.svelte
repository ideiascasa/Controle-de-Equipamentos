<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Link } from '@sveltejs/kit';
	import { ArrowLeft } from 'lucide-svelte';

	export let data: PageData;
	export let form: any;
</script>

<div class="container mx-auto py-6 max-w-2xl">
	<div class="mb-6">
		<Button asChild variant="ghost" class="mb-4">
			<Link href="/equipment/{data.equipment.id}">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Voltar
			</Link>
		</Button>
		<h1 class="text-3xl font-bold">Registrar Manutenção</h1>
		<p class="text-muted-foreground">{data.equipment.name} - {data.equipment.code}</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Nova Manutenção</CardTitle>
			<CardDescription>Registre uma manutenção para o equipamento</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/registerMaintenance" use:enhance>
				<div class="space-y-4">
					<div>
						<Label for="type">Tipo *</Label>
						<select id="type" name="type" required class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
							<option value="preventive">Preventiva</option>
							<option value="corrective">Corretiva</option>
							<option value="calibration">Calibração</option>
						</select>
					</div>

					<div>
						<Label for="description">Descrição *</Label>
						<Textarea id="description" name="description" required />
					</div>

					<div>
						<Label for="provider">Fornecedor/Prestador</Label>
						<Input id="provider" name="provider" />
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="cost">Custo (em centavos)</Label>
							<Input id="cost" name="cost" type="number" />
						</div>

						<div>
							<Label for="status">Status</Label>
							<select id="status" name="status" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
								<option value="scheduled">Agendada</option>
								<option value="in_progress">Em Andamento</option>
								<option value="completed">Concluída</option>
								<option value="cancelled">Cancelada</option>
							</select>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<Label for="startDate">Data de Início *</Label>
							<Input id="startDate" name="startDate" type="date" required />
						</div>

						<div>
							<Label for="endDate">Data de Fim</Label>
							<Input id="endDate" name="endDate" type="date" />
						</div>
					</div>

					<div>
						<Label for="nextMaintenanceDate">Próxima Manutenção</Label>
						<Input id="nextMaintenanceDate" name="nextMaintenanceDate" type="date" />
					</div>

					<div>
						<Label for="notes">Observações</Label>
						<Textarea id="notes" name="notes" />
					</div>

					<div class="flex gap-2 justify-end">
						<Button type="button" variant="outline" href="/equipment/{data.equipment.id}">Cancelar</Button>
						<Button type="submit">Registrar</Button>
					</div>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
