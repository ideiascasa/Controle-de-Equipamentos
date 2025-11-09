<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<section class="rounded-lg border border-border bg-card p-6">
	<header class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="text-xl font-semibold">Linha do tempo</h2>
			<p class="text-sm text-muted-foreground">
				{data.equipment.name} ({data.equipment.assetCode})
			</p>
		</div>
		<a class="rounded border border-border px-3 py-2 text-sm font-medium" href={`/equipment/${data.equipment.id}`}>
			Voltar
		</a>
	</header>

	{#if data.events.length === 0}
		<p class="text-sm text-muted-foreground">Nenhum evento registrado.</p>
	{:else}
		<ol class="relative border-s border-border pl-6">
			{#each data.events as event}
				<li class="mb-8 ms-6">
					<span class="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold">
						{event.eventType.slice(0, 2).toUpperCase()}
					</span>
					<div class="rounded border border-border bg-background p-4">
						<div class="flex flex-wrap items-center justify-between gap-2 text-sm">
							<span class="font-medium uppercase">{event.eventType}</span>
							<span class="text-xs text-muted-foreground">
								{event.createdAt ? new Date(event.createdAt).toLocaleString() : '-'}
							</span>
						</div>
						{#if event.actorUserId}
							<p class="mt-1 text-xs text-muted-foreground">Autor: {event.actorUserId}</p>
						{/if}
						{#if event.payload}
							<pre class="mt-3 overflow-x-auto rounded bg-muted/30 p-3 text-xs">
{JSON.stringify(event.payload, null, 2)}</pre
							>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</section>
