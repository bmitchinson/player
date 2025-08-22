<script lang="ts">
	let fileList: string[] = $state([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function* getFilesRecursively(
		dirHandle: FileSystemDirectoryHandle,
		path = ''
	): AsyncGenerator<string> {
		for await (const [name, handle] of dirHandle.entries()) {
			const currentPath = path ? `${path}/${name}` : name;
			if (handle.kind === 'file') {
				yield currentPath;
			} else if (handle.kind === 'directory') {
				yield* getFilesRecursively(handle, currentPath);
			}
		}
	}

	async function pickFolder() {
		fileList = [];
		isLoading = true;
		error = null;

		try {
			// Check if the File System Access API is supported
			if (!('showDirectoryPicker' in window)) {
				throw new Error('File System Access API is not supported in this browser');
			}

			// Show directory picker
			const dirHandle = await window.showDirectoryPicker();

			// Recursively get all files
			for await (const filePath of getFilesRecursively(dirHandle)) {
				fileList = [...fileList, filePath];
			}
		} catch (err: any) {
			if (err.name !== 'AbortError') {
				error = err.message;
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="folder-lister">
	<button onclick={pickFolder} disabled={isLoading} class="pick-button">
		{isLoading ? 'Loading...' : 'Pick Folder'}
	</button>

	{#if error}
		<div class="error">
			Error: {error}
		</div>
	{/if}

	{#if fileList.length > 0}
		<div class="file-count">
			Found {fileList.length} files
		</div>
		<ul class="file-list">
			{#each fileList as filePath}
				<li>{filePath}</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.file-list {
		max-height: 400px;
		overflow-y: auto;
		list-style: none;
		padding: 0;
	}

	.file-list li {
		font-family: monospace;
	}
</style>
