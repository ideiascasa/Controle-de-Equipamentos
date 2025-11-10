<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | null = null;
</script>

<section class="rounded-lg border border-border bg-card p-6">
	<header class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="text-xl font-semibold">Movimentar equipamento</h2>
			<p class="text-sm text-muted-foreground">
				{data.equipment.name} ({data.equipment.assetCode}) — Local atual:
				{data.equipment.locationName ?? data.equipment.locationId ?? 'Nao definido'}
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
			<label class="text-sm font-medium" for="targetLocationId">Destino *</label>
			<select
				id="targetLocationId"
				name="targetLocationId"
				required
				class="rounded border border-input bg-background px-3 py-2 text-sm"
			>
				<option value=''>Selecionar local</option>
				{#each data.locations as location}
					<option value={location.id}>
						{location.name} ({location.type})
					</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="note">Nota de solicitacao</label>
			<textarea
				id="note"
				name="note"
				rows="3"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
				placeholder="Justifique o motivo da movimentacao"
			></textarea>
		</div>

		<div class="md:col-span-2 flex flex-col gap-2">
			<label class="text-sm font-medium" for="authorizationNote">Nota para autorizacao</label>
			<textarea
				id="authorizationNote"
				name="authorizationNote"
				rows="3"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
				placeholder="Informacoes adicionais para o aprovador"
			></textarea>
		</div>

		<div class="md:col-span-2 flex items-center justify-end gap-3">
			<button class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
				Enviar solicitacao
			</button>
		</div>
	</form>
</section>

<section class="mt-6 rounded-lg border border-border bg-card p-6">
	<header class="mb-4">
		<h3 class="text-lg font-semibold">Movimentacoes pendentes</h3>
		<p class="text-sm text-muted-foreground">Cancelamento rapido de solicitacoes abertas.</p>
	</header>

	{#if data.pendingMovements.length === 0}
		<p class="text-sm text-muted-foreground">Nenhuma movimentacao pendente.</p>
	{:else}
		<ul class="flex flex-col divide-y divide-border">
			{#each data.pendingMovements as movement}
				<li class="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
					<div>
						<div class="font-medium">
							Destino: {movement.targetLocationName ?? movement.targetLocationId ?? '-'}
						</div>
						<div class="text-xs text-muted-foreground">
							Solicitado em {movement.requestedAt ? new Date(movement.requestedAt).toLocaleString() : '-'}
						</div>
					</div>
					<form method="post" action="?/cancel" class="flex items-center gap-2">
						<input type="hidden" name="movementId" value={movement.id} />
						<button class="rounded border border-border px-3 py-1.5 text-xs font-medium hover:border-destructive hover:text-destructive">
							Cancelar
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</section>
