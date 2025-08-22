<script lang="ts">
	import FolderFileLister from '$lib/components/FolderFileLister.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';

	let audioUrl = $state<string | null>(null);
	let currentFileName = $state<string | null>(null);

	function handleFileSelect(file: File, fileName: string) {
		// Clean up previous URL
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
		}

		// Create new URL for the selected file
		audioUrl = URL.createObjectURL(file);
		currentFileName = fileName;
	}
</script>

<svelte:head>
	<title>Ben Amp - MP3 Player</title>
	<meta name="description" content="A web-based MP3 player for local music files" />
</svelte:head>

<main>
	<h1>Ben Amp</h1>
	<p>Select a folder containing MP3 files to browse and play your music.</p>

	<FolderFileLister onFileSelect={handleFileSelect} />

	<AudioPlayer {audioUrl} {currentFileName} />
</main>
