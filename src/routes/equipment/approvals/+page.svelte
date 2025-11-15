<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form: ActionData | null = null;
</script>

<section class="rounded-lg border border-border bg-card p-6">
	<header class="mb-6">
		<h2 class="text-xl font-semibold">Painel de aprovacoes</h2>
		<p class="text-sm text-muted-foreground">
			Analise, aprove ou rejeite movimentacoes de equipamentos.
		</p>
	</header>

	{#if form?.message}
		<div class="mb-4 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
			{form.message}
		</div>
	{/if}

	{#if data.pending.length === 0}
		<p class="text-sm text-muted-foreground">Nenhuma solicitacao pendente.</p>
	{:else}
		<ul class="space-y-4">
			{#each data.pending as movement}
				<li class="rounded-lg border border-border bg-background p-4 text-sm">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 class="text-base font-semibold">{movement.equipmentName}</h3>
							<p class="text-xs text-muted-foreground">Codigo: {movement.assetCode}</p>
						</div>
						<span class="text-xs text-muted-foreground">
							Solicitado em {movement.requestedAt ? new Date(movement.requestedAt).toLocaleString() : '-'}
						</span>
					</div>
					<div class="mt-2 text-xs text-muted-foreground">
						Destino: {movement.targetLocationName ?? movement.targetLocationId ?? 'Nao informado'}
					</div>
					{#if movement.movementNote}
						<p class="mt-2 text-xs">Nota do solicitante: {movement.movementNote}</p>
					{/if}
					{#if movement.authorizationNote}
						<p class="mt-1 text-xs text-muted-foreground">
							Detalhes adicionais: {movement.authorizationNote}
						</p>
					{/if}

					<div class="mt-4 grid gap-3 md:grid-cols-2">
						<form method="post" action="?/approve" use:enhance class="flex flex-col gap-2">
							<input type="hidden" name="movementId" value={movement.id} />
							<label class="text-xs font-medium text-muted-foreground" for={`approve-note-${movement.id}`}>
								Observacao (opcional)
							</label>
							<textarea
								id={`approve-note-${movement.id}`}
								name="note"
								rows="2"
								class="rounded border border-input bg-background px-3 py-2 text-xs"
								placeholder="Mensagem para o solicitante"
							></textarea>
							<button class="rounded bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700">
								Aprovar solicitacao
							</button>
						</form>

						<form method="post" action="?/reject" use:enhance class="flex flex-col gap-2">
							<input type="hidden" name="movementId" value={movement.id} />
							<label class="text-xs font-medium text-muted-foreground" for={`reject-note-${movement.id}`}>
								Motivo da rejeicao
							</label>
							<textarea
								id={`reject-note-${movement.id}`}
								name="note"
								rows="2"
								class="rounded border border-input bg-background px-3 py-2 text-xs"
								placeholder="Descreva o motivo"
							></textarea>
							<button class="rounded bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700">
								Rejeitar solicitacao
							</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
