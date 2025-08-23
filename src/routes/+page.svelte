<script lang="ts">
	import FolderFileLister from '$lib/components/FolderFileLister.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';

	let audioUrl = $state<string | null>(null);
	let currentFileName = $state<string | null>(null);
	let currentFile = $state<File | null>(null);
	let trackQueue = $state<{ file: File; fileName: string }[]>([]);
	let currentTrackIndex = $state<number>(-1);

	// Functions to get next/previous track from sorted table
	let getNextTrack = $state<(() => { file: File; fileName: string } | null) | undefined>();
	let getPreviousTrack = $state<(() => { file: File; fileName: string } | null) | undefined>();

	function handleFileSelect(file: File, fileName: string) {
		// Find the index of this file in the queue
		const trackIndex = trackQueue.findIndex((track) => track.fileName === fileName);

		if (trackIndex !== -1) {
			currentTrackIndex = trackIndex;
			playTrack(trackIndex);
		}
	}

	function playTrack(index: number) {
		if (index < 0 || index >= trackQueue.length) return;

		const track = trackQueue[index];

		// Clean up previous URL
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
		}

		// Create new URL for the selected file
		audioUrl = URL.createObjectURL(track.file);
		currentFileName = track.fileName;
		currentFile = track.file;
		currentTrackIndex = index;
	}

	function playNextTrack() {
		// Try to get next track from sorted table first
		const nextTrack = getNextTrack?.();
		if (nextTrack) {
			handleFileSelect(nextTrack.file, nextTrack.fileName);
		} else {
			// Fallback to original queue-based logic if table function not available
			if (currentTrackIndex < trackQueue.length - 1) {
				playTrack(currentTrackIndex + 1);
			}
		}
	}

	function playPreviousTrack() {
		// Try to get previous track from sorted table first
		const previousTrack = getPreviousTrack?.();
		if (previousTrack) {
			handleFileSelect(previousTrack.file, previousTrack.fileName);
		} else {
			// Fallback to original queue-based logic if table function not available
			if (currentTrackIndex > 0) {
				playTrack(currentTrackIndex - 1);
			}
		}
	}

	function updateTrackQueue(files: { file: File; fileName: string }[]) {
		trackQueue = files;
	}

	function handleStop() {
		// Clean up current URL
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
		}

		// Reset state
		audioUrl = null;
		currentFileName = null;
		currentFile = null;
		currentTrackIndex = -1;
	}
</script>

<svelte:head>
	<title>Local Media Player</title>
	<meta name="description" content="A web-based MP3 player for local music files" />
</svelte:head>

<main class="w-full max-w-3xl space-y-6">
	<div class="space-y-2 text-center">
		<h1 class="text-3xl font-bold text-white">Local Media Player</h1>
		<p class="text-gray-400">Select a folder containing MP3 files to browse and play your music.</p>
	</div>

	<div class="w-full">
		<FolderFileLister
			onFileSelect={handleFileSelect}
			onTrackQueueUpdate={updateTrackQueue}
			{currentFileName}
			bind:getNextTrack
			bind:getPreviousTrack
		/>
	</div>

	<div class="w-full">
		<AudioPlayer
			{audioUrl}
			{currentFileName}
			{currentFile}
			onTrackEnd={playNextTrack}
			onStop={handleStop}
			onNext={playNextTrack}
			onPrevious={playPreviousTrack}
		/>
	</div>
</main>
