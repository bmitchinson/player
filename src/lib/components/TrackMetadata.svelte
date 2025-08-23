<script lang="ts">
	interface ITrackMetadata {
		title?: string;
		album?: string;
		artist?: string;
		track?: number;
		duration?: number;
		artwork?: string;
	}

	interface TrackMetadataProps {
		metadata?: ITrackMetadata | null;
		fileName?: string | null;
		isLoading?: boolean;
	}

	let { metadata = null, fileName = null, isLoading = false }: TrackMetadataProps = $props();

	function formatDuration(seconds?: number): string {
		if (!seconds) return '--:--';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function getDisplayTitle(): string {
		if (metadata?.title) return metadata.title;
		if (fileName) return fileName.replace('.mp3', '');
		return 'Unknown Track';
	}
</script>

<div class="w-full rounded-lg border border-gray-700 bg-gray-800 p-4">
	<div class="space-y-3">
		<div class="text-center">
			<h3 class="text-sm font-medium tracking-wide text-gray-400 uppercase">Now Playing</h3>
		</div>

		{#if isLoading}
			<div class="py-4 text-center">
				<div class="animate-pulse space-y-2">
					<div class="mx-auto h-6 w-3/4 rounded bg-gray-600"></div>
					<div class="mx-auto h-4 w-1/2 rounded bg-gray-700"></div>
					<div class="mx-auto h-4 w-1/3 rounded bg-gray-700"></div>
				</div>
			</div>
		{:else if metadata || fileName}
			<div class="flex gap-4">
				<!-- Album Artwork -->
				<div class="flex-shrink-0">
					{#if metadata?.artwork}
						<img
							src={metadata.artwork}
							alt="Album artwork"
							class="h-32 w-32 rounded-lg object-cover shadow-md"
						/>
					{:else}
						<div
							class="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-700 shadow-md"
						>
							<div class="text-center">
								<span class="text-3xl">🎵</span>
								<p class="mt-1 text-xs text-gray-400">No Artwork</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- Metadata -->
				<div class="flex-1 space-y-2">
					<div>
						<dt class="text-xs font-medium tracking-wide text-gray-400 uppercase">Title</dt>
						<dd class="text-lg font-semibold break-words text-gray-100">{getDisplayTitle()}</dd>
					</div>

					<div>
						<dt class="text-xs font-medium tracking-wide text-gray-400 uppercase">Artist</dt>
						<dd class="text-base break-words text-gray-200">{metadata?.artist || '—'}</dd>
					</div>

					<div>
						<dt class="text-xs font-medium tracking-wide text-gray-400 uppercase">Album</dt>
						<dd class="text-base break-words text-gray-300">{metadata?.album || '—'}</dd>
					</div>

					<div>
						<dt class="text-xs font-medium tracking-wide text-gray-400 uppercase">Track</dt>
						<dd class="text-base break-words text-gray-300">{metadata?.track || '—'}</dd>
					</div>

					<div class="flex items-center justify-between border-t border-gray-700 pt-2">
						<div>
							<dt class="text-xs font-medium tracking-wide text-gray-400 uppercase">Length</dt>
							<dd class="text-sm text-gray-300">{formatDuration(metadata?.duration)}</dd>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="py-6 text-center">
				<p class="text-gray-400 italic">Select a track to see metadata</p>
			</div>
		{/if}
	</div>
</div>
