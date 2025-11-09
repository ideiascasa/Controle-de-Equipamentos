<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form: ActionData | null = null;

	const typeOptions = [
		{ value: 'matriz', label: 'Matriz' },
		{ value: 'filial', label: 'Filial' },
		{ value: 'sala', label: 'Sala' },
		{ value: 'outro', label: 'Outro' }
	];
</script>

<section class="rounded-lg border border-border bg-card p-6">
	<header class="mb-6">
		<h2 class="text-xl font-semibold">Cadastrar local</h2>
		<p class="text-sm text-muted-foreground">
			Defina pontos de armazenamento e unidades para rastrear movimentacoes.
		</p>
	</header>

	{#if form?.message}
		<div class="mb-4 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
			{form.message}
		</div>
	{/if}

	<form class="grid gap-4 md:grid-cols-2" method="post" use:enhance>
		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="location-name">Nome *</label>
			<input
				id="location-name"
				name="name"
				required
				class="rounded border border-input bg-background px-3 py-2 text-sm"
				placeholder="Ex: Deposito principal"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="location-type">Tipo</label>
			<select id="location-type" name="type" class="rounded border border-input bg-background px-3 py-2 text-sm">
				{#each typeOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="location-parent">Local pai (opcional)</label>
			<select id="location-parent" name="parentId" class="rounded border border-input bg-background px-3 py-2 text-sm">
				<option value=''>Sem pai</option>
				{#each data.locations as location}
					<option value={location.id}>{location.name}</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="location-timezone">Timezone</label>
			<input
				id="location-timezone"
				name="timezone"
				class="rounded border border-input bg-background px-3 py-2 text-sm"
				placeholder="America/Sao_Paulo"
			/>
		</div>

		<div class="md:col-span-2 flex items-center justify-end">
			<button class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
				Cadastrar
			</button>
		</div>
	</form>
</section>

<section class="mt-6 rounded-lg border border-border bg-card p-6">
	<header class="mb-4">
		<h3 class="text-lg font-semibold">Locais cadastrados</h3>
		<p class="text-sm text-muted-foreground">
			Edite nomes, hierarquias e ative ou desative unidades.
		</p>
	</header>

	{#if data.locations.length === 0}
		<p class="text-sm text-muted-foreground">Nenhum local cadastrado.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-border text-sm">
				<thead class="bg-muted/40">
					<tr class="text-left">
						<th class="px-3 py-2 font-medium">Nome</th>
						<th class="px-3 py-2 font-medium">Tipo</th>
						<th class="px-3 py-2 font-medium">Pai</th>
						<th class="px-3 py-2 font-medium">Timezone</th>
						<th class="px-3 py-2 font-medium">Status</th>
						<th class="px-3 py-2 font-medium">Acoes</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border bg-background">
					{#each data.locations as location}
						<tr>
							<td class="px-3 py-2">{location.name}</td>
							<td class="px-3 py-2">{location.type}</td>
							<td class="px-3 py-2">{location.parentId ?? '-'}</td>
							<td class="px-3 py-2">{location.timezone ?? '-'}</td>
							<td class="px-3 py-2">
								<span class={`rounded-full px-2.5 py-1 text-xs font-medium ${location.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
									{location.isActive ? 'Ativo' : 'Inativo'}
								</span>
							</td>
							<td class="px-3 py-2">
								<details class="group">
									<summary class="cursor-pointer text-xs font-medium text-primary">Editar</summary>
									<form method="post" action="?/update" class="mt-3 flex flex-col gap-2 rounded border border-border bg-muted/10 p-3" use:enhance>
										<input type="hidden" name="id" value={location.id} />
										<label class="text-xs font-medium" for={`edit-name-${location.id}`}>Nome</label>
										<input
											id={`edit-name-${location.id}`}
											name="name"
											class="rounded border border-input bg-background px-3 py-2 text-xs"
											value={location.name}
										/>
										<label class="text-xs font-medium" for={`edit-type-${location.id}`}>Tipo</label>
										<select
											id={`edit-type-${location.id}`}
											name="type"
											class="rounded border border-input bg-background px-3 py-2 text-xs"
											value={location.type}
										>
											{#each typeOptions as option}
												<option value={option.value}>{option.label}</option>
											{/each}
										</select>
										<label class="text-xs font-medium" for={`edit-parent-${location.id}`}>Pai</label>
										<select
											id={`edit-parent-${location.id}`}
											name="parentId"
											class="rounded border border-input bg-background px-3 py-2 text-xs"
											value={location.parentId ?? ''}
										>
											<option value=''>Sem pai</option>
											{#each data.locations as candidate}
												{#if candidate.id !== location.id}
													<option value={candidate.id}>{candidate.name}</option>
												{/if}
											{/each}
										</select>
										<label class="text-xs font-medium" for={`edit-timezone-${location.id}`}>Timezone</label>
										<input
											id={`edit-timezone-${location.id}`}
											name="timezone"
											class="rounded border border-input bg-background px-3 py-2 text-xs"
											value={location.timezone ?? ''}
										/>
										<label class="text-xs font-medium" for={`edit-active-${location.id}`}>Status</label>
										<select
											id={`edit-active-${location.id}`}
											name="isActive"
											class="rounded border border-input bg-background px-3 py-2 text-xs"
											value={location.isActive ? 'true' : 'false'}
										>
											<option value="true">Ativo</option>
											<option value="false">Inativo</option>
										</select>
										<button class="rounded bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
											Salvar
										</button>
									</form>
								</details>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
