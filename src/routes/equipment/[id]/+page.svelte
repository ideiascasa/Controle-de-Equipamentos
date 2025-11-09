<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const statusLabels: Record<string, string> = {
		ativo: 'Ativo',
		em_manutencao: 'Em manutencao',
		inativo: 'Inativo'
	};

	const typeLabels: Record<string, string> = {
		preventiva: 'Preventiva',
		corretiva: 'Corretiva',
		calibracao: 'Calibracao'
	};
</script>

<section class="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
	<header class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="text-2xl font-semibold">{data.equipment.name}</h2>
			<p class="text-sm text-muted-foreground">Codigo: {data.equipment.assetCode}</p>
		</div>
		<div class="flex gap-2">
			<a class="rounded border border-border px-3 py-2 text-sm font-medium" href={`/equipment/${data.equipment.id}/edit`}>
				Editar
			</a>
			<a class="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" href={`/equipment/${data.equipment.id}/transfer`}>
				Movimentar
			</a>
		</div>
	</header>

	<div class="grid gap-4 md:grid-cols-2">
		<div class="rounded border border-border bg-background p-4">
			<h3 class="text-sm font-semibold uppercase text-muted-foreground">Resumo</h3>
			<dl class="mt-3 grid gap-2 text-sm">
				<div class="flex justify-between">
					<dt>Status</dt>
					<dd class="font-medium">{statusLabels[data.equipment.status] ?? data.equipment.status}</dd>
				</div>
				<div class="flex justify-between">
					<dt>Criticidade</dt>
					<dd class="font-medium">{data.equipment.criticality}</dd>
				</div>
				<div class="flex justify-between">
					<dt>Categoria</dt>
					<dd>{data.equipment.category ?? '-'}</dd>
				</div>
				<div class="flex justify-between">
					<dt>Local atual</dt>
					<dd>{data.equipment.locationName ?? data.equipment.locationId ?? 'Nao definido'}</dd>
				</div>
				<div class="flex justify-between">
					<dt>Responsavel</dt>
					<dd>{data.equipment.custodianUserId ?? 'Nao definido'}</dd>
				</div>
			</dl>
		</div>
		<div class="rounded border border-border bg-background p-4">
			<h3 class="text-sm font-semibold uppercase text-muted-foreground">Datas</h3>
			<dl class="mt-3 grid gap-2 text-sm">
				<div class="flex justify-between">
					<dt>Aquisicao</dt>
					<dd>{data.equipment.acquisitionDate ? new Date(data.equipment.acquisitionDate).toLocaleDateString() : '-'}</dd>
				</div>
				<div class="flex justify-between">
					<dt>Depreciacao</dt>
					<dd>{data.equipment.depreciationEnd ? new Date(data.equipment.depreciationEnd).toLocaleDateString() : '-'}</dd>
				</div>
				<div class="flex justify-between">
					<dt>Criado</dt>
					<dd>{data.equipment.createdAt ? new Date(data.equipment.createdAt).toLocaleString() : '-'}</dd>
				</div>
				<div class="flex justify-between">
					<dt>Atualizado</dt>
					<dd>{data.equipment.updatedAt ? new Date(data.equipment.updatedAt).toLocaleString() : '-'}</dd>
				</div>
			</dl>
		</div>
	</div>

	{#if data.equipment.description}
		<div class="rounded border border-border bg-background p-4">
			<h3 class="text-sm font-semibold uppercase text-muted-foreground">Descricao</h3>
			<p class="mt-2 text-sm leading-relaxed">{data.equipment.description}</p>
		</div>
	{/if}

	{#if data.equipment.metadata}
		<div class="rounded border border-border bg-background p-4">
			<h3 class="text-sm font-semibold uppercase text-muted-foreground">Metadata</h3>
			<pre class="mt-2 overflow-x-auto rounded bg-muted/30 p-3 text-xs">
{JSON.stringify(data.equipment.metadata, null, 2)}</pre
			>
		</div>
	{/if}
</section>

<section class="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
	<header class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-semibold">Movimentacoes</h3>
			<p class="text-sm text-muted-foreground">Solicitacoes e aprovacoes registradas.</p>
		</div>
		<a class="text-sm font-medium text-primary underline-offset-2 hover:underline" href={`/equipment/${data.equipment.id}/transfer`}>
			Nova movimentacao
		</a>
	</header>

	{#if data.movements.length === 0}
		<p class="text-sm text-muted-foreground">Nenhuma movimentacao registrada.</p>
	{:else}
		<ul class="flex flex-col divide-y divide-border text-sm">
			{#each data.movements as movement}
				<li class="flex flex-col gap-1 py-3">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<span class="font-medium">Status: {movement.status}</span>
						<span class="text-xs text-muted-foreground">
							Solicitado em {movement.requestedAt ? new Date(movement.requestedAt).toLocaleString() : '-'}
						</span>
					</div>
					<div class="text-xs text-muted-foreground">
						Destino: {movement.targetLocationName ?? movement.targetLocationId ?? '-'}
					</div>
					{#if movement.movementNote}
						<div class="text-xs">Nota: {movement.movementNote}</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
	<header class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-semibold">Manutencoes</h3>
			<p class="text-sm text-muted-foreground">Historico preventivo e corretivo.</p>
		</div>
		<a class="text-sm font-medium text-primary underline-offset-2 hover:underline" href={`/equipment/${data.equipment.id}/maintenance`}>
			Registrar manutencao
		</a>
	</header>

	{#if data.maintenances.length === 0}
		<p class="text-sm text-muted-foreground">Nenhuma manutencao registrada.</p>
	{:else}
		<ul class="flex flex-col divide-y divide-border text-sm">
			{#each data.maintenances as item}
				<li class="flex flex-col gap-1 py-3">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<span class="font-medium">{typeLabels[item.type] ?? item.type}</span>
						<span class="text-xs text-muted-foreground">Status: {item.status}</span>
					</div>
					<div class="text-xs text-muted-foreground">
						Agendada: {item.scheduledFor ? new Date(item.scheduledFor).toLocaleString() : '-'}
						| Inicio: {item.startedAt ? new Date(item.startedAt).toLocaleString() : '-'}
						| Fim: {item.completedAt ? new Date(item.completedAt).toLocaleString() : '-'}
					</div>
					{#if item.resultNote}
						<div class="text-xs">Resultado: {item.resultNote}</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
	<header class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-semibold">Politicas aplicaveis</h3>
			<p class="text-sm text-muted-foreground">Regras de aprovacao vinculadas.</p>
		</div>
		<a class="text-sm font-medium text-primary underline-offset-2 hover:underline" href="/equipment/approvals">
			Ver aprovacoes
		</a>
	</header>

	{#if data.policies.length === 0}
		<p class="text-sm text-muted-foreground">Nenhuma politica cadastrada para este equipamento.</p>
	{:else}
		<ul class="flex flex-col divide-y divide-border text-sm">
			{#each data.policies as policy}
				<li class="flex flex-col gap-1 py-3">
					<div class="flex items-center justify-between">
						<span class="font-medium">{policy.name}</span>
						<span class="text-xs text-muted-foreground">{policy.scope}</span>
					</div>
					<div class="text-xs text-muted-foreground">
						{policy.role ? `Papel: ${policy.role} | ` : ''}{policy.category ? `Categoria: ${policy.category} | ` : ''}{policy.locationId ? `Local: ${policy.locationId} | ` : ''}Aprovacao: {policy.requiresApproval ? 'Obrigatoria' : 'Opcional'}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
	<header>
		<h3 class="text-lg font-semibold">Auditoria</h3>
		<p class="text-sm text-muted-foreground">Linha do tempo de eventos relevantes.</p>
	</header>

	{#if data.auditLog.length === 0}
		<p class="text-sm text-muted-foreground">Nenhum evento registrado.</p>
	{:else}
		<ul class="space-y-3 text-sm">
			{#each data.auditLog as event}
				<li class="rounded border border-border bg-background p-3">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<span class="font-medium uppercase">{event.eventType}</span>
						<span class="text-xs text-muted-foreground">{event.createdAt ? new Date(event.createdAt).toLocaleString() : '-'}</span>
					</div>
					{#if event.actorUserId}
						<p class="text-xs text-muted-foreground mt-1">Autor: {event.actorUserId}</p>
					{/if}
					{#if event.payload}
						<pre class="mt-2 overflow-x-auto rounded bg-muted/30 p-2 text-xs">
{JSON.stringify(event.payload, null, 2)}</pre
						>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>
