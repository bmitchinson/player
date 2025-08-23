<script lang="ts">
	interface ITrackMetadata {
		title?: string;
		album?: string;
		artist?: string;
		duration?: number;
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

<div class="w-full rounded-lg border border-gray-200 bg-white p-4">
	<div class="space-y-3">
		<div class="text-center">
			<h3 class="text-sm font-medium tracking-wide text-gray-600 uppercase">Now Playing</h3>
		</div>

		{#if isLoading}
			<div class="py-4 text-center">
				<div class="animate-pulse space-y-2">
					<div class="mx-auto h-6 w-3/4 rounded bg-gray-300"></div>
					<div class="mx-auto h-4 w-1/2 rounded bg-gray-200"></div>
					<div class="mx-auto h-4 w-1/3 rounded bg-gray-200"></div>
				</div>
			</div>
		{:else if metadata || fileName}
			<div class="space-y-2">
				<div>
					<dt class="text-xs font-medium tracking-wide text-gray-500 uppercase">Title</dt>
					<dd class="text-lg font-semibold break-words text-gray-900">{getDisplayTitle()}</dd>
				</div>

				{#if metadata?.artist}
					<div>
						<dt class="text-xs font-medium tracking-wide text-gray-500 uppercase">Artist</dt>
						<dd class="text-base break-words text-gray-800">{metadata.artist}</dd>
					</div>
				{/if}

				{#if metadata?.album}
					<div>
						<dt class="text-xs font-medium tracking-wide text-gray-500 uppercase">Album</dt>
						<dd class="text-base break-words text-gray-700">{metadata.album}</dd>
					</div>
				{/if}

				<div class="flex items-center justify-between border-t border-gray-100 pt-2">
					<div>
						<dt class="text-xs font-medium tracking-wide text-gray-500 uppercase">Length</dt>
						<dd class="text-sm text-gray-600">{formatDuration(metadata?.duration)}</dd>
					</div>
				</div>
			</div>
		{:else}
			<div class="py-6 text-center">
				<p class="text-gray-500 italic">Select a track to see metadata</p>
			</div>
		{/if}
	</div>
</div>
