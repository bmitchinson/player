<script lang="ts">
	import { parseBlob } from 'music-metadata';
	import TrackMetadata from './TrackMetadata.svelte';

	interface ITrackMetadata {
		title?: string;
		album?: string;
		artist?: string;
		track?: number;
		duration?: number;
		artwork?: string;
	}

	interface AudioPlayerProps {
		audioUrl?: string | null;
		currentFileName?: string | null;
		currentFile?: File | null;
		onTrackEnd?: () => void;
		onStop?: () => void;
	}

	let {
		audioUrl = null,
		currentFileName = null,
		currentFile = null,
		onTrackEnd,
		onStop
	}: AudioPlayerProps = $props();

	let audioElement = $state<HTMLAudioElement | undefined>();
	let metadata = $state<ITrackMetadata | null>(null);
	let isLoadingMetadata = $state(false);

	// Extract metadata when a new file is loaded
	$effect(() => {
		if (currentFile) {
			extractMetadata(currentFile);
		} else {
			// Clean up previous artwork URL if it exists
			if (metadata?.artwork) {
				URL.revokeObjectURL(metadata.artwork);
			}
			metadata = null;
		}
	});

	// Auto-play when new track is loaded
	$effect(() => {
		if (audioElement && audioUrl) {
			// Small delay to ensure audio is ready
			setTimeout(() => {
				audioElement?.play().catch((error) => {
					console.warn('Auto-play failed:', error);
				});
			}, 100);
		}
	});

	async function extractMetadata(file: File) {
		isLoadingMetadata = true;
		try {
			const audioMetadata = await parseBlob(file);

			// Clean up previous artwork URL if it exists
			if (metadata?.artwork) {
				URL.revokeObjectURL(metadata.artwork);
			}

			// Extract artwork if available
			let artworkUrl: string | undefined;
			if (audioMetadata.common.picture && audioMetadata.common.picture.length > 0) {
				const picture = audioMetadata.common.picture[0];
				const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
				artworkUrl = URL.createObjectURL(blob);
			}

			metadata = {
				title: audioMetadata.common.title,
				album: audioMetadata.common.album,
				artist: audioMetadata.common.artist,
				track: audioMetadata.common.track?.no || undefined,
				duration: audioMetadata.format.duration,
				artwork: artworkUrl
			};
		} catch (error) {
			console.warn('Failed to extract metadata:', error);
			metadata = null;
		} finally {
			isLoadingMetadata = false;
		}
	}

	function handleTrackEnd() {
		onTrackEnd?.();
	}

	function handleStop() {
		if (audioElement) {
			audioElement.pause();
			audioElement.currentTime = 0;
		}
		// Clean up artwork URL when stopping
		if (metadata?.artwork) {
			URL.revokeObjectURL(metadata.artwork);
		}
		onStop?.();
	}
</script>

<div class="w-full space-y-4">
	<!-- Metadata Display -->
	<TrackMetadata {metadata} fileName={currentFileName} isLoading={isLoadingMetadata} />

	<!-- Audio Player -->
	<div class="w-full rounded-lg border border-gray-700 bg-gray-800 p-6">
		{#if audioUrl && currentFileName}
			<div class="flex items-center gap-4">
				<audio
					bind:this={audioElement}
					src={audioUrl}
					controls
					preload="metadata"
					class="flex-1"
					onended={handleTrackEnd}
				>
					Your browser does not support the audio element.
				</audio>

				<button
					onclick={handleStop}
					class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none"
					type="button"
				>
					Stop
				</button>
			</div>
		{:else}
			<div class="py-4 text-center">
				<p class="text-sm text-gray-400 italic">
					No track selected. Click on an MP3 file from the list above to start playing.
				</p>
			</div>
		{/if}
	</div>
</div>
