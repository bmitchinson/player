<script lang="ts">
	import { MetadataCache } from '$lib/utils/metadataCache';

	interface CacheManagerProps {
		isOpen?: boolean;
		onClose?: () => void;
	}

	let { isOpen = false, onClose }: CacheManagerProps = $props();

	let cacheStats = $state({
		totalEntries: 0,
		cacheSize: '0 KB'
	});

	let isClearing = $state(false);

	// Update stats when modal opens
	$effect(() => {
		if (isOpen) {
			updateCacheStats();
		}
	});

	function updateCacheStats() {
		cacheStats = MetadataCache.getStats();
	}

	async function clearCache() {
		if (
			confirm(
				'Are you sure you want to clear all cached metadata? This will require re-extracting metadata for all files.'
			)
		) {
			isClearing = true;
			try {
				MetadataCache.clear();
				updateCacheStats();
			} finally {
				isClearing = false;
			}
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose?.();
		}
	}
</script>

{#if isOpen}
	<!-- Modal backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center" onclick={handleBackdropClick}>
		<!-- Modal content -->
		<div class="border-theme w-full max-w-md rounded border bg-white p-6">
			<div class="mb-4 flex items-center justify-between">
				<h2>Cache Management</h2>
				<button onclick={onClose} class="border-theme rounded border p-1" type="button"> ✕ </button>
			</div>

			<div class="space-y-4">
				<!-- Cache Statistics -->
				<div class="space-y-2">
					<h3>Cache Statistics</h3>
					<div class="space-y-1">
						<div class="flex justify-between">
							<span>Total Entries:</span>
							<span>{cacheStats.totalEntries}</span>
						</div>
						<div class="flex justify-between">
							<span>Cache Size:</span>
							<span>{cacheStats.cacheSize}</span>
						</div>
					</div>
				</div>

				<!-- Cache Information -->
				<div class="space-y-2">
					<h3>How it works</h3>
					<div>
						<p class="mb-2">
							Metadata is cached using an optimized format that takes ~1KB per 400 songs.
						</p>
						<p class="mb-2">
							Cache is checked before extracting metadata to speed up subsequent loads.
						</p>
						<p>Cache entries persist until manually cleared.</p>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex gap-2">
					<button
						onclick={updateCacheStats}
						class="border-theme flex-1 rounded border px-4 py-2"
						type="button"
					>
						Refresh Stats
					</button>
					<button
						onclick={clearCache}
						disabled={isClearing || cacheStats.totalEntries === 0}
						class="border-theme flex-1 rounded border px-4 py-2 disabled:opacity-50"
						type="button"
					>
						{isClearing ? 'Clearing...' : 'Clear Cache'}
					</button>
				</div>

				{#if cacheStats.totalEntries === 0}
					<div class="text-center">
						No cached metadata found. Load some music files to start building the cache.
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
