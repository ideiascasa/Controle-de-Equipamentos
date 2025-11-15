<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | null = null;
</script>

<section class="rounded-lg border border-border bg-card p-6">
	<header class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="text-xl font-semibold">Registrar manutencao</h2>
			<p class="text-sm text-muted-foreground">
				{data.equipment.name} ({data.equipment.assetCode}) — Status atual: {data.equipment.status}
			</p>
		</div>
		<a class="rounded border border-border px-3 py-2 text-sm font-medium" href={`/equipment/${data.equipment.id}`}>
			Voltar
		</a>
	</header>

	{#if form?.message}
		<div class="mb-4 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
			{form.message}
		</div>
	{/if}

	<form class="grid gap-4 md:grid-cols-2" method="post">
		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="type">Tipo *</label>
			<select id="type" name="type" required class="rounded border border-input bg-background px-3 py-2 text-sm">
				<option value=''>Selecionar</option>
				<option value="preventiva">Preventiva</option>
				<option value="corretiva">Corretiva</option>
				<option value="calibracao">Calibracao</option>
			</select>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="status">Status do equipamento</label>
			<select id="status" name="status" class="rounded border border-input bg-background px-3 py-2 text-sm">
				<option value="em_manutencao">Em manutencao</option>
				<option value="ativo">Ativo</option>
				<option value="inativo">Inativo</option>
			</select>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="scheduledFor">Data agendada</label>
			<input
				id="scheduledFor"
				name="scheduledFor"
				type="datetime-local"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="startedAt">Inicio</label>
			<input
				id="startedAt"
				name="startedAt"
				type="datetime-local"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="completedAt">Conclusao</label>
			<input
				id="completedAt"
				name="completedAt"
				type="datetime-local"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="technicianUserId">Tecnico (user id)</label>
			<input
				id="technicianUserId"
				name="technicianUserId"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
			/>
		</div>

		<div class="md:col-span-2 flex flex-col gap-2">
			<label class="text-sm font-medium" for="resultNote">Resultado / observacoes</label>
			<textarea
				id="resultNote"
				name="resultNote"
				rows="4"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
				placeholder="Descreva atividades executadas, pecas trocadas, laudos..."
			></textarea>
		</div>

		<div class="md:col-span-2 flex items-center justify-end gap-3">
			<button class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
				Registrar
			</button>
		</div>
	</form>
</section>

<section class="mt-6 rounded-lg border border-border bg-card p-6">
	<header class="mb-4">
		<h3 class="text-lg font-semibold">Historico de manutencoes</h3>
		<p class="text-sm text-muted-foreground">Eventos registrados para este equipamento.</p>
	</header>

	{#if data.maintenanceHistory.length === 0}
		<p class="text-sm text-muted-foreground">Nenhum registro de manutencao.</p>
	{:else}
		<ul class="space-y-3 text-sm">
			{#each data.maintenanceHistory as item}
				<li class="rounded border border-border bg-background p-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<span class="font-medium">Tipo: {item.type} — Status: {item.status}</span>
						<span class="text-xs text-muted-foreground">
							Agendada: {item.scheduledFor ? new Date(item.scheduledFor).toLocaleString() : '-'}
						</span>
					</div>
					<div class="mt-1 text-xs text-muted-foreground">
						Inicio: {item.startedAt ? new Date(item.startedAt).toLocaleString() : '-'} | Fim:
						{item.completedAt ? new Date(item.completedAt).toLocaleString() : '-'}
					</div>
					<div class="mt-1 text-xs text-muted-foreground">
						Tecnico: {item.technicianUserId ?? 'Nao informado'}
					</div>
					{#if item.resultNote}
						<p class="mt-2 text-xs">Resultado: {item.resultNote}</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>
