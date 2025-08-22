<script lang="ts">
	interface FileItem {
		path: string;
		depth: number;
		isDirectory: boolean;
		fileHandle?: FileSystemFileHandle;
	}

	interface FolderFileListerProps {
		onFileSelect?: (file: File, fileName: string) => void;
	}

	let { onFileSelect }: FolderFileListerProps = $props();

	let fileList: FileItem[] = $state([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let directoryHandle: FileSystemDirectoryHandle | null = null;

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
				yield* getFilesRecursively(handle as FileSystemDirectoryHandle, currentPath, depth + 1);
			} else if (handle.kind === 'file') {
				// Only include MP3 files
				if (name.toLowerCase().endsWith('.mp3')) {
					yield {
						path: currentPath,
						depth,
						isDirectory: false,
						fileHandle: handle as FileSystemFileHandle
					};
				}
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
			directoryHandle = await window.showDirectoryPicker();

			// Recursively get all files
			for await (const fileItem of getFilesRecursively(directoryHandle)) {
				fileList = [...fileList, fileItem];
			}
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			if (err instanceof Error && err.name !== 'AbortError') {
				error = errorMessage;
			}
		} finally {
			isLoading = false;
		}
	}

	async function handleFileClick(item: FileItem) {
		if (item.isDirectory || !item.fileHandle) return;

		try {
			const file = await item.fileHandle.getFile();
			const fileName = item.path.split('/').pop() || file.name;
			onFileSelect?.(file, fileName);
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			error = `Failed to load file: ${errorMessage}`;
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
			Found {fileList.filter((item) => !item.isDirectory).length} MP3 files and {fileList.filter(
				(item) => item.isDirectory
			).length} folders
		</div>
		<ul class="file-list">
			{#each fileList as item (item.path)}
				{#if item.isDirectory}
					<li class="file-item" style="padding-left: {item.depth * 20}px">
						<span class="item-icon">📁</span>
						<span class="item-name">{item.path.split('/').pop()}</span>
					</li>
				{:else}
					<li class="file-item">
						<button
							class="file-button"
							style="padding-left: {item.depth * 20}px"
							onclick={() => handleFileClick(item)}
							type="button"
						>
							<span class="item-icon">🎵</span>
							<span class="item-name">{item.path.split('/').pop()}</span>
						</button>
					</li>
				{/if}
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

	.file-button {
		width: 100%;
		background: none;
		border: none;
		cursor: pointer;
		border-radius: 4px;
		padding: 4px 2px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: monospace;
		text-align: left;
	}

	.file-button:hover {
		background-color: #f0f0f0;
	}

	.file-button:focus {
		outline: 2px solid #0066cc;
		outline-offset: 2px;
	}

	.item-icon {
		flex-shrink: 0;
	}

	.item-name {
		word-break: break-all;
	}
</style>
