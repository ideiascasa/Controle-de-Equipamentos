<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<section class="rounded-lg border border-border bg-card p-6">
	<header class="mb-6">
		<h2 class="text-xl font-semibold">Exportar relatorios</h2>
		<p class="text-sm text-muted-foreground">
			Gere CSV filtrado por status, criticidade e categoria.
		</p>
	</header>

	<form class="grid gap-4 md:grid-cols-3" method="post" action="?/export">
		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="report-status">Status</label>
			<select id="report-status" name="status" class="rounded border border-input bg-background px-3 py-2 text-sm">
				<option value=''>Todos</option>
				<option value="ativo">Ativo</option>
				<option value="em_manutencao">Em manutencao</option>
				<option value="inativo">Inativo</option>
			</select>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="report-criticality">Criticidade</label>
			<select
				id="report-criticality"
				name="criticality"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
			>
				<option value=''>Todas</option>
				<option value="baixa">Baixa</option>
				<option value="media">Media</option>
				<option value="alta">Alta</option>
			</select>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="report-category">Categoria</label>
			<input
				id="report-category"
				name="category"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
				placeholder="Ex: notebook"
			/>
		</div>

		<div class="md:col-span-3 flex items-center justify-end">
			<button class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
				Gerar CSV
			</button>
		</div>
	</form>
</section>

<section class="mt-6 rounded-lg border border-border bg-card p-6">
	<header class="mb-4">
		<h3 class="text-lg font-semibold">Resumo atual</h3>
		<p class="text-sm text-muted-foreground">Contagem por status do inventario.</p>
	</header>

	{#if data.totals.length === 0}
		<p class="text-sm text-muted-foreground">Nenhum equipamento cadastrado.</p>
	{:else}
		<ul class="grid gap-3 md:grid-cols-3">
			{#each data.totals as item}
				<li class="rounded border border-border bg-background p-4 text-sm">
					<span class="text-xs uppercase text-muted-foreground">{item.status}</span>
					<p class="mt-2 text-2xl font-semibold">{item.count}</p>
				</li>
			{/each}
		</ul>
	{/if}
</section>
