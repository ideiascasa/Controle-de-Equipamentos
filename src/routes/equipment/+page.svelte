<script lang="ts">
	import { equipmentFilters } from '$lib/stores/equipment';
	import type { PageData } from './$types';

	export let data: PageData;

	let search = data.filters.search ?? '';
	let status = data.filters.status ?? '';
	let criticality = data.filters.criticality ?? '';
	let category = data.filters.category ?? '';
	let locationId = data.filters.locationId ?? '';

	const summary = data.summary as {
		total: number;
		byStatus: Record<string, number>;
		byCriticality: Record<string, number>;
	};

	$: equipmentFilters.set({
		search,
		status: status || null,
		locationId: locationId || null,
		category: category || null,
		criticality: criticality || null
	});

	const statusBadges: Record<string, string> = {
		ativo: 'bg-emerald-100 text-emerald-700',
		em_manutencao: 'bg-amber-100 text-amber-700',
		inativo: 'bg-slate-200 text-slate-700'
	};

	const criticalityBadges: Record<string, string> = {
		baixa: 'bg-emerald-50 text-emerald-700',
		media: 'bg-blue-50 text-blue-700',
		alta: 'bg-rose-50 text-rose-700'
	};
</script>

<section class="grid gap-4 md:grid-cols-4">
	<div class="rounded-lg border border-border bg-card p-4">
		<p class="text-sm text-muted-foreground">Total de equipamentos</p>
		<p class="mt-2 text-3xl font-semibold">{summary.total}</p>
	</div>
	<div class="rounded-lg border border-border bg-card p-4">
		<p class="text-sm text-muted-foreground">Ativos</p>
		<p class="mt-2 text-3xl font-semibold">{summary.byStatus['ativo'] ?? 0}</p>
	</div>
	<div class="rounded-lg border border-border bg-card p-4">
		<p class="text-sm text-muted-foreground">Em manutencao</p>
		<p class="mt-2 text-3xl font-semibold">{summary.byStatus['em_manutencao'] ?? 0}</p>
	</div>
	<div class="rounded-lg border border-border bg-card p-4">
		<p class="text-sm text-muted-foreground">Alta criticidade</p>
		<p class="mt-2 text-3xl font-semibold">{summary.byCriticality['alta'] ?? 0}</p>
	</div>
</section>

<form class="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 lg:grid-cols-5" method="get">
	<label class="flex flex-col gap-1 text-sm">
		<span>Buscar</span>
		<input
			name="q"
			placeholder="Nome ou codigo do ativo"
			class="rounded border border-input bg-background px-3 py-2 text-sm"
			bind:value={search}
		/>
	</label>

	<label class="flex flex-col gap-1 text-sm">
		<span>Status</span>
		<select
			name="status"
			class="rounded border border-input bg-background px-3 py-2 text-sm"
			bind:value={status}
		>
			<option value=''>Todos</option>
			<option value="ativo">Ativo</option>
			<option value="em_manutencao">Em manutencao</option>
			<option value="inativo">Inativo</option>
		</select>
	</label>

	<label class="flex flex-col gap-1 text-sm">
		<span>Criticidade</span>
		<select
			name="criticality"
			class="rounded border border-input bg-background px-3 py-2 text-sm"
			bind:value={criticality}
		>
			<option value=''>Todas</option>
			<option value="baixa">Baixa</option>
			<option value="media">Media</option>
			<option value="alta">Alta</option>
		</select>
	</label>

	<label class="flex flex-col gap-1 text-sm">
		<span>Categoria</span>
		<input
			name="category"
			class="rounded border border-input bg-background px-3 py-2 text-sm"
			placeholder="ex: notebook"
			bind:value={category}
		/>
	</label>

	<label class="flex flex-col gap-1 text-sm">
		<span>Local</span>
		<input
			name="locationId"
			class="rounded border border-input bg-background px-3 py-2 text-sm"
			placeholder="ID do local"
			bind:value={locationId}
		/>
	</label>

	<div class="flex items-end gap-2">
		<button class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
			Filtrar
		</button>
		<a class="rounded border border-border px-4 py-2 text-sm font-medium" href="/equipment">
			Limpar
		</a>
	</div>
</form>

<section class="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
	<header class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-semibold">Lista de equipamentos</h2>
			<p class="text-sm text-muted-foreground">Controle de ativos com status e local atual.</p>
		</div>
		<a class="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" href="/equipment/new">
			Novo equipamento
		</a>
	</header>

	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-border text-sm">
			<thead class="bg-muted/40">
				<tr class="text-left">
					<th class="px-3 py-2 font-medium">Ativo</th>
					<th class="px-3 py-2 font-medium">Status</th>
					<th class="px-3 py-2 font-medium">Criticidade</th>
					<th class="px-3 py-2 font-medium">Local</th>
					<th class="px-3 py-2 font-medium">Categoria</th>
					<th class="px-3 py-2 font-medium">Atualizado</th>
					<th class="px-3 py-2 font-medium sr-only">Acoes</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border bg-background">
				{#if data.equipment.length === 0}
					<tr>
						<td class="px-3 py-6 text-center text-muted-foreground" colspan="7">
							Nenhum equipamento encontrado com os filtros atuais.
						</td>
					</tr>
				{:else}
					{#each data.equipment as item}
						<tr>
							<td class="px-3 py-3">
								<div class="flex flex-col">
									<span class="font-medium">{item.name}</span>
									<span class="text-xs text-muted-foreground">{item.assetCode}</span>
								</div>
							</td>
							<td class="px-3 py-3">
								<span class={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadges[item.status] ?? 'bg-slate-100 text-slate-700'}`}>
									{item.status}
								</span>
							</td>
							<td class="px-3 py-3">
								<span class={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${criticalityBadges[item.criticality] ?? 'bg-slate-100 text-slate-700'}`}>
									{item.criticality}
								</span>
							</td>
							<td class="px-3 py-3">
								{#if item.locationName}
									<div class="flex flex-col">
										<span>{item.locationName}</span>
										{#if item.locationId}
											<span class="text-xs text-muted-foreground">{item.locationId}</span>
										{/if}
									</div>
								{:else}
									<span class="text-xs text-muted-foreground">Nao definido</span>
								{/if}
							</td>
							<td class="px-3 py-3">
								{item.category ?? '-'}
							</td>
							<td class="px-3 py-3">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</td>
							<td class="px-3 py-3 text-right">
								<a class="text-sm font-medium text-primary underline-offset-2 hover:underline" href={`/equipment/${item.id}`}>
									Detalhes
								</a>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</section>

<section class="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
	<header>
		<h2 class="text-lg font-semibold">Movimentacoes pendentes</h2>
		<p class="text-sm text-muted-foreground">
			Acompanhe solicitacoes aguardando aprovacao.
		</p>
	</header>

	{#if data.movements.length === 0}
		<p class="text-sm text-muted-foreground">Nenhuma movimentacao pendente.</p>
	{:else}
		<ul class="flex flex-col divide-y divide-border">
			{#each data.movements as movement}
				<li class="flex flex-col gap-1 py-3">
					<div class="flex items-center justify-between text-sm">
						<div class="font-medium">{movement.equipmentName} ({movement.assetCode})</div>
						<div class="text-xs text-muted-foreground">
							Solicitado em {movement.requestedAt ? new Date(movement.requestedAt).toLocaleString() : '-'}
						</div>
					</div>
					<div class="text-xs text-muted-foreground">
						Destino: {movement.targetLocationName ?? movement.targetLocationId ?? 'Nao informado'}
					</div>
					<div>
						<a class="text-sm font-medium text-primary underline-offset-2 hover:underline" href={`/equipment/approvals?movementId=${movement.id}`}>
							Abrir aprovacao
						</a>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
