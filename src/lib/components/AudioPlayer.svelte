<script lang="ts">
	interface AudioPlayerProps {
		audioUrl?: string | null;
		currentFileName?: string | null;
	}

	let { audioUrl = null, currentFileName = null }: AudioPlayerProps = $props();

	let audioElement = $state<HTMLAudioElement | undefined>();
</script>

<div class="audio-player">
	{#if audioUrl && currentFileName}
		<div class="now-playing">
			<h3>Now Playing</h3>
			<p class="track-name">{currentFileName}</p>
		</div>

		<audio
			bind:this={audioElement}
			src={audioUrl}
			controls
			preload="metadata"
			class="audio-controls"
		>
			Your browser does not support the audio element.
		</audio>
	{:else}
		<div class="no-track">
			<p>No track selected. Click on an MP3 file from the list above to start playing.</p>
		</div>
	{/if}
</div>

<style>
	.audio-player {
		margin-top: 20px;
		padding: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
		background-color: #f9f9f9;
	}

	.now-playing {
		margin-bottom: 15px;
	}

	.now-playing h3 {
		margin: 0 0 5px 0;
		font-size: 16px;
		color: #333;
	}

	.track-name {
		margin: 0;
		font-weight: bold;
		color: #555;
		word-break: break-all;
	}

	.audio-controls {
		width: 100%;
		max-width: 500px;
	}

	.no-track {
		text-align: center;
		color: #666;
		font-style: italic;
	}

	.no-track p {
		margin: 0;
	}
</style>
