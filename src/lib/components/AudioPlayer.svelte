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
		onNext?: () => void;
		onPrevious?: () => void;
	}

	let {
		audioUrl = null,
		currentFileName = null,
		currentFile = null,
		onTrackEnd,
		onStop,
		onNext,
		onPrevious
	}: AudioPlayerProps = $props();

	let audioElement = $state<HTMLAudioElement | undefined>();
	let metadata = $state<ITrackMetadata | null>(null);
	let isLoadingMetadata = $state(false);
	let repeatSong = $state(false);

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
			// Clear MediaSession metadata
			if ('mediaSession' in navigator) {
				navigator.mediaSession.metadata = null;
			}
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
			let artworkMimeType: string | undefined;
			if (audioMetadata.common.picture && audioMetadata.common.picture.length > 0) {
				const picture = audioMetadata.common.picture[0];
				const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
				artworkUrl = URL.createObjectURL(blob);
				artworkMimeType = picture.format;
			}

			metadata = {
				title: audioMetadata.common.title,
				album: audioMetadata.common.album,
				artist: audioMetadata.common.artist,
				track: audioMetadata.common.track?.no || undefined,
				duration: audioMetadata.format.duration,
				artwork: artworkUrl
			};

			// Set MediaSession metadata
			setMediaSessionMetadata(metadata, artworkUrl, artworkMimeType);
		} catch (error) {
			console.warn('Failed to extract metadata:', error);
			metadata = null;
			// Clear MediaSession metadata on error
			if ('mediaSession' in navigator) {
				navigator.mediaSession.metadata = null;
			}
		} finally {
			isLoadingMetadata = false;
		}
	}

	function setMediaSessionMetadata(
		metadata: ITrackMetadata,
		artworkUrl?: string,
		artworkMimeType?: string
	) {
		// Set MediaSession metadata if supported
		if ('mediaSession' in navigator) {
			const mediaMetadata: MediaMetadataInit = {
				title: metadata.title || currentFileName || 'Unknown Track',
				artist: metadata.artist || '',
				album: metadata.album || ''
			};

			// Add artwork if available
			if (artworkUrl && artworkMimeType) {
				mediaMetadata.artwork = [
					{
						src: artworkUrl,
						type: artworkMimeType,
						sizes: '512x512'
					}
				];
			}

			navigator.mediaSession.metadata = new MediaMetadata(mediaMetadata);

			// Set up action handlers
			navigator.mediaSession.setActionHandler('play', () => {
				audioElement?.play();
			});
			navigator.mediaSession.setActionHandler('pause', () => {
				audioElement?.pause();
			});
			navigator.mediaSession.setActionHandler('stop', () => {
				handleStop();
			});

			// Enable next track if callback provided
			if (onNext) {
				navigator.mediaSession.setActionHandler('nexttrack', () => {
					onNext();
				});
			}

			// Enable previous track if callback provided
			if (onPrevious) {
				navigator.mediaSession.setActionHandler('previoustrack', () => {
					onPrevious();
				});
			}
		}
	}

	function handleTrackEnd() {
		if (repeatSong && audioElement) {
			audioElement.currentTime = 0;
			audioElement.play().catch((error) => {
				console.warn('Repeat play failed:', error);
			});
		} else {
			onTrackEnd?.();
		}
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
		// Clear MediaSession metadata when stopped
		if ('mediaSession' in navigator) {
			navigator.mediaSession.metadata = null;
		}
		onStop?.();
	}
</script>

<div class="w-full space-y-4">
	<!-- Metadata Display -->
	<TrackMetadata {metadata} fileName={currentFileName} isLoading={isLoadingMetadata} />

	<!-- Audio Player -->
	<div class="w-full rounded-lg border p-6">
		{#if audioUrl && currentFileName}
			<div class="space-y-4">
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

					<button onclick={handleStop} class="rounded px-4 py-2" type="button"> Stop </button>
				</div>

				<div class="flex items-center gap-2">
					<input type="checkbox" id="repeat-song" bind:checked={repeatSong} class="h-4 w-4" />
					<label for="repeat-song" class="text-sm">Repeat Song</label>
				</div>
			</div>
		{:else}
			<div class="py-4 text-center">
				<p>No track selected. Click on an MP3 file from the list above to start playing.</p>
			</div>
		{/if}
	</div>
</div>
