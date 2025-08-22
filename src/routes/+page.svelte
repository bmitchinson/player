<script lang="ts">
	import FolderFileLister from '$lib/components/FolderFileLister.svelte';
</script>

<svelte:head>
	<title>Folder File Lister</title>
	<meta name="description" content="A tool to recursively list files in a selected folder" />
</svelte:head>

<main>
	<h1>Folder File Lister</h1>
	<p>Select a folder to see all files within it, including subdirectories.</p>

	<FolderFileLister />
</main>
