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

<div class="border-theme w-full rounded-lg border p-4">
	<div class="space-y-3">
		<div class="text-center">
			<h3 class="uppercase">Now Playing</h3>
		</div>

		{#if isLoading}
			<div class="py-4 text-center">
				<div class="animate-pulse space-y-2">
					<div class="mx-auto h-6 w-3/4 rounded"></div>
					<div class="mx-auto h-4 w-1/2 rounded"></div>
					<div class="mx-auto h-4 w-1/3 rounded"></div>
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
							class="h-32 w-32 rounded-lg object-cover"
						/>
					{:else}
						<div class="flex h-32 w-32 items-center justify-center rounded-lg">
							<div class="text-center">
								<span>🎵</span>
								<p class="mt-1">No Artwork</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- Metadata -->
				<div class="flex-1 space-y-2">
					<div>
						<dt class="uppercase">Title</dt>
						<dd class="break-words">{getDisplayTitle()}</dd>
					</div>

					<div>
						<dt class="uppercase">Artist</dt>
						<dd class="break-words">{metadata?.artist || '—'}</dd>
					</div>

					<div>
						<dt class="uppercase">Album</dt>
						<dd class="break-words">{metadata?.album || '—'}</dd>
					</div>

					<div>
						<dt class="uppercase">Track</dt>
						<dd class="break-words">{metadata?.track || '—'}</dd>
					</div>

					<div class="border-theme flex items-center justify-between border-t pt-2">
						<div>
							<dt class="uppercase">Length</dt>
							<dd>{formatDuration(metadata?.duration)}</dd>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="py-6 text-center">
				<p>Select a track to see metadata</p>
			</div>
		{/if}
	</div>
</div>
