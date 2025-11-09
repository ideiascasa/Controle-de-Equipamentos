<script lang="ts">
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData | null = null;

	const statusOptions = [
		{ value: 'ativo', label: 'Ativo' },
		{ value: 'em_manutencao', label: 'Em manutencao' },
		{ value: 'inativo', label: 'Inativo' }
	];

	const criticalityOptions = [
		{ value: 'baixa', label: 'Baixa' },
		{ value: 'media', label: 'Media' },
		{ value: 'alta', label: 'Alta' }
	];

	const metadataExample = '{"garantia":"2026-12-31"}';
</script>

<section class="rounded-lg border border-border bg-card p-6">
	<header class="mb-6">
		<h2 class="text-xl font-semibold">Novo equipamento</h2>
		<p class="text-sm text-muted-foreground">
			Defina os dados basicos e associe o ativo a um local e responsavel.
		</p>
	</header>

	{#if form?.message}
		<div class="mb-4 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
			{form.message}
		</div>
	{/if}

	<form class="grid gap-4 md:grid-cols-2" method="post">
		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="assetCode">Codigo do ativo *</label>
			<input
				id="assetCode"
				name="assetCode"
				required
				class="rounded border border-input bg-background px-3 py-2 text-sm"
				placeholder="ex: EQP-001"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="name">Nome *</label>
			<input
				id="name"
				name="name"
				required
				class="rounded border border-input bg-background px-3 py-2 text-sm"
				placeholder="Nome do equipamento"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="status">Status</label>
			<select id="status" name="status" class="rounded border border-input bg-background px-3 py-2 text-sm">
				{#each statusOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="criticality">Criticidade</label>
			<select
				id="criticality"
				name="criticality"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
			>
				{#each criticalityOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="category">Categoria</label>
			<input
				id="category"
				name="category"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
				placeholder="Categoria do ativo"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="locationId">Local</label>
			<select
				id="locationId"
				name="locationId"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
			>
				<option value=''>Selecionar</option>
				{#each data.locations as location}
					<option value={location.id}>
						{location.name} ({location.type})
					</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="custodianUserId">Responsavel (user id)</label>
			<input
				id="custodianUserId"
				name="custodianUserId"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
				placeholder="ID do usuario"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="acquisitionDate">Data de aquisicao</label>
			<input
				id="acquisitionDate"
				name="acquisitionDate"
				type="date"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="depreciationEnd">Fim da depreciacao</label>
			<input
				id="depreciationEnd"
				name="depreciationEnd"
				type="date"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
			/>
		</div>

		<div class="md:col-span-2 flex flex-col gap-2">
			<label class="text-sm font-medium" for="description">Descricao</label>
			<textarea
				id="description"
				name="description"
				rows="4"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
				placeholder="Detalhes tecnicos, serie, fabricante..."
			></textarea>
		</div>

		<div class="md:col-span-2 flex flex-col gap-2">
			<label class="text-sm font-medium" for="metadata">Metadata (JSON)</label>
			<textarea
				id="metadata"
				name="metadata"
				rows="4"
				class="rounded border border-input bg-background px-3 py-2 font-mono text-xs"
				placeholder={metadataExample}
			></textarea>
			<p class="text-xs text-muted-foreground">
				Use pares chave-valor adicionais conforme necessario.
			</p>
		</div>

		<div class="md:col-span-2 flex items-center justify-end gap-3">
			<a class="rounded border border-border px-4 py-2 text-sm font-medium" href="/equipment">
				Cancelar
			</a>
			<button
				class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-70"
				type="submit"
			>
				Salvar
			</button>
		</div>
	</form>
</section>
