<script lang="ts">
	interface FileItem {
		path: string;
		depth: number;
		isDirectory: boolean;
	}

	let fileList: FileItem[] = $state([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function* getFilesRecursively(
		dirHandle: FileSystemDirectoryHandle,
		path = '',
		depth = 0
	): AsyncGenerator<FileItem> {
		const entries: [string, FileSystemHandle][] = [];

		// Collect all entries first
		for await (const [name, handle] of dirHandle.entries()) {
			// Skip hidden files/folders that start with "."
			if (name.startsWith('.')) continue;
			entries.push([name, handle]);
		}

		// Sort entries: directories first, then files, both alphabetically
		entries.sort(([nameA, handleA], [nameB, handleB]) => {
			if (handleA.kind !== handleB.kind) {
				return handleA.kind === 'directory' ? -1 : 1;
			}
			return nameA.localeCompare(nameB);
		});

		// Process entries in order: directories first, then files
		for (const [name, handle] of entries) {
			const currentPath = path ? `${path}/${name}` : name;

			if (handle.kind === 'directory') {
				// Yield the directory
				yield { path: currentPath, depth, isDirectory: true };
				// Immediately yield its contents
				yield* getFilesRecursively(handle, currentPath, depth + 1);
			} else if (handle.kind === 'file') {
				yield { path: currentPath, depth, isDirectory: false };
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
			for await (const fileItem of getFilesRecursively(dirHandle)) {
				fileList = [...fileList, fileItem];
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
			Found {fileList.filter((item) => !item.isDirectory).length} files and {fileList.filter(
				(item) => item.isDirectory
			).length} folders
		</div>
		<ul class="file-list">
			{#each fileList as item}
				<li class="file-item" style="padding-left: {item.depth * 20}px">
					<span class="item-icon">{item.isDirectory ? '📁' : '📄'}</span>
					<span class="item-name">{item.path.split('/').pop()}</span>
				</li>
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

	.file-item {
		font-family: monospace;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 2px 0;
	}

	.item-icon {
		flex-shrink: 0;
	}

	.item-name {
		word-break: break-all;
	}
</style>
