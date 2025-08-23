<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
	<div
		class="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-start p-6 text-white"
	>
		{@render children?.()}
	</div>
</div>
