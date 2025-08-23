<script lang="ts">
	import TrackTable from './TrackTable.svelte';

	interface FileItem {
		path: string;
		depth: number;
		isDirectory: boolean;
		fileHandle?: FileSystemFileHandle;
	}

	interface FolderFileListerProps {
		onFileSelect?: (file: File, fileName: string) => void;
		onTrackQueueUpdate?: (tracks: { file: File; fileName: string }[]) => void;
		currentFileName?: string | null;
	}

	let {
		onFileSelect,
		onTrackQueueUpdate,
		currentFileName = null
	}: FolderFileListerProps = $props();

	let fileList: FileItem[] = $state([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let directoryHandle: FileSystemDirectoryHandle | null = null;
	let tracks: { file: File; fileName: string }[] = $state([]);

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

			// Build track queue and tracks list from MP3 files
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

	function handleTrackSelect(file: File, fileName: string) {
		onFileSelect?.(file, fileName);
	}

	async function updateTrackQueue() {
		const trackList: { file: File; fileName: string }[] = [];

		try {
			for (const item of fileList) {
				if (!item.isDirectory && item.fileHandle) {
					const file = await item.fileHandle.getFile();
					const fileName = item.path.split('/').pop() || file.name;
					trackList.push({ file, fileName });
				}
			}
			tracks = trackList;
			onTrackQueueUpdate?.(trackList);
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
		<div class="mb-4 text-center text-sm text-gray-600">
			Found {fileList.filter((item) => !item.isDirectory).length} MP3 files in {fileList.filter(
				(item) => item.isDirectory
			).length} folders
		</div>

		<TrackTable {tracks} onTrackSelect={handleTrackSelect} {currentFileName} />
	{/if}
</div>
