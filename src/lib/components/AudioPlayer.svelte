<script lang="ts">
	interface AudioPlayerProps {
		audioUrl?: string | null;
		currentFileName?: string | null;
		onTrackEnd?: () => void;
		onStop?: () => void;
	}

	let { audioUrl = null, currentFileName = null, onTrackEnd, onStop }: AudioPlayerProps = $props();

	let audioElement = $state<HTMLAudioElement | undefined>();

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

	function handleTrackEnd() {
		onTrackEnd?.();
	}

	function handleStop() {
		if (audioElement) {
			audioElement.pause();
			audioElement.currentTime = 0;
		}
		onStop?.();
	}
</script>

<div class="w-full rounded-lg border border-gray-300 bg-gray-50 p-6">
	{#if audioUrl && currentFileName}
		<div class="mb-4 text-center">
			<h3 class="text-sm font-medium text-gray-700">Now Playing</h3>
			<p class="font-bold break-all text-gray-900">{currentFileName}</p>
		</div>

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
				class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
				type="button"
			>
				Stop
			</button>
		</div>
	{:else}
		<div class="py-4 text-center">
			<p class="text-sm text-gray-500 italic">
				No track selected. Click on an MP3 file from the list above to start playing.
			</p>
		</div>
	{/if}
</div>
