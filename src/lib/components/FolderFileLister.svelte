<script lang="ts">
	interface FileItem {
		path: string;
		depth: number;
		isDirectory: boolean;
		fileHandle?: FileSystemFileHandle;
	}

	interface FolderFileListerProps {
		onFileSelect?: (file: File, fileName: string) => void;
		onTrackQueueUpdate?: (tracks: { file: File; fileName: string }[]) => void;
	}

	let { onFileSelect, onTrackQueueUpdate }: FolderFileListerProps = $props();

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

			// Build track queue from MP3 files
			await updateTrackQueue();
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

	async function updateTrackQueue() {
		if (!onTrackQueueUpdate) return;

		const tracks: { file: File; fileName: string }[] = [];

		try {
			for (const item of fileList) {
				if (!item.isDirectory && item.fileHandle) {
					const file = await item.fileHandle.getFile();
					const fileName = item.path.split('/').pop() || file.name;
					tracks.push({ file, fileName });
				}
			}
			onTrackQueueUpdate(tracks);
		} catch (err: unknown) {
			console.warn('Failed to build track queue:', err);
		}
	}
</script>

<div class="w-full space-y-4">
	<div class="text-center">
		<button
			onclick={pickFolder}
			disabled={isLoading}
			class="rounded-lg bg-blue-500 px-6 py-3 font-medium text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			{isLoading ? 'Loading...' : 'Pick Folder'}
		</button>
	</div>

	{#if error}
		<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
			<p class="text-red-700">Error: {error}</p>
		</div>
	{/if}

	{#if fileList.length > 0}
		<div class="text-center text-sm text-gray-600">
			Found {fileList.filter((item) => !item.isDirectory).length} MP3 files and {fileList.filter(
				(item) => item.isDirectory
			).length} folders
		</div>
		<ul class="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white">
			{#each fileList as item (item.path)}
				{#if item.isDirectory}
					<li
						class="flex items-center gap-2 px-3 py-1 font-mono text-sm"
						style="padding-left: {item.depth * 20 + 12}px"
					>
						<span>📁</span>
						<span class="break-all">{item.path.split('/').pop()}</span>
					</li>
				{:else}
					<li>
						<button
							class="flex w-full items-center gap-2 rounded px-3 py-1 text-left font-mono text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
							style="padding-left: {item.depth * 20 + 12}px"
							onclick={() => handleFileClick(item)}
							type="button"
						>
							<span>🎵</span>
							<span class="break-all">{item.path.split('/').pop()}</span>
						</button>
					</li>
				{/if}
			{/each}
		</ul>
	{/if}
</div>
