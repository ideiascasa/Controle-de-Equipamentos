<script lang="ts">
	export let data: {
		user: {
			id: string;
			username: string;
			name: string | null;
		} | null;
		navigation: { href: string; label: string; active: boolean }[];
	};
</script>

<div class="min-h-screen bg-background">
	<div class="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10">
		<header class="flex flex-col gap-2 border-b border-border pb-4">
			<h1 class="text-3xl font-semibold tracking-tight">Gestao de equipamentos</h1>
			<p class="text-sm text-muted-foreground">
				Controle completo de ativos, movimentacoes, manutencoes e auditoria.
			</p>
			<nav class="flex flex-wrap gap-2 pt-2">
				{#each data.navigation as item}
					<a
						class="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors {item.active
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-border bg-background text-foreground hover:border-primary/30'}"
						href={item.href}
					>
						{item.label}
					</a>
				{/each}
			</nav>
		</header>

		<main class="flex flex-col gap-6">
			<slot />
		</main>
	</div>
</div>
