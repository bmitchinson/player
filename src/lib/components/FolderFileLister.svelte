<script lang="ts">
	import TrackTable from './TrackTable.svelte';
	import FolderSidebar from './FolderSidebar.svelte';

	interface FileItem {
		path: string;
		depth: number;
		isDirectory: boolean;
		fileHandle?: FileSystemFileHandle;
	}

	interface FolderItem {
		path: string;
		name: string;
		depth: number;
		isSelected: boolean;
	}

	interface FolderFileListerProps {
		onFileSelect?: (file: File, fileName: string) => void;
		onTrackQueueUpdate?: (tracks: { file: File; fileName: string }[]) => void;
		currentFileName?: string | null;
		getNextTrack?: () => { file: File; fileName: string } | null;
	}

	let {
		onFileSelect,
		onTrackQueueUpdate,
		currentFileName = null,
		getNextTrack = $bindable()
	}: FolderFileListerProps = $props();

	let fileList: FileItem[] = $state([]);
	let folderList: FolderItem[] = $state([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let directoryHandle: FileSystemDirectoryHandle | null = null;
	let tracks: { file: File; fileName: string }[] = $state([]);
	let selectedFolder = $state<string | null>(null);

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

			// Extract folders from file list
			extractFolders();

			// Select root folder by default if available
			if (folderList.length > 0) {
				selectedFolder = folderList[0].path;
				await updateTrackQueueForFolder(selectedFolder);
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

	function handleTrackSelect(file: File, fileName: string) {
		onFileSelect?.(file, fileName);
	}

	function extractFolders() {
		const seenPaths: string[] = [];
		const folders: FolderItem[] = [];

		// Add root folder
		if (directoryHandle) {
			folders.push({
				path: '',
				name: directoryHandle.name,
				depth: 0,
				isSelected: false
			});
			seenPaths.push('');
		}

		// Extract unique folders from file paths
		for (const item of fileList) {
			if (item.isDirectory) {
				const pathParts = item.path.split('/');
				for (let i = 1; i <= pathParts.length; i++) {
					const folderPath = pathParts.slice(0, i).join('/');
					if (!seenPaths.includes(folderPath)) {
						seenPaths.push(folderPath);
						folders.push({
							path: folderPath,
							name: pathParts[i - 1],
							depth: i,
							isSelected: false
						});
					}
				}
			}
		}

		folderList = folders.sort((a, b) => {
			if (a.depth !== b.depth) return a.depth - b.depth;
			return a.path.localeCompare(b.path);
		});
	}

	async function handleFolderSelect(folderPath: string) {
		selectedFolder = folderPath;
		await updateTrackQueueForFolder(folderPath);
	}

	async function updateTrackQueueForFolder(folderPath: string) {
		const trackList: { file: File; fileName: string }[] = [];

		try {
			for (const item of fileList) {
				if (!item.isDirectory && item.fileHandle) {
					// Check if this file is in the selected folder
					const itemFolder = item.path.substring(0, item.path.lastIndexOf('/'));
					if (
						folderPath === '' ||
						itemFolder === folderPath ||
						itemFolder.startsWith(folderPath + '/')
					) {
						const file = await item.fileHandle.getFile();
						const fileName = item.path.split('/').pop() || file.name;
						trackList.push({ file, fileName });
					}
				}
			}
			tracks = trackList;
			onTrackQueueUpdate?.(trackList);
		} catch (err: unknown) {
			console.warn('Failed to build track queue:', err);
		}
	}

	// Bindable function to get next track from table
	let getNextTrackFromTable = $state<(() => { file: File; fileName: string } | null) | undefined>();

	$effect(() => {
		getNextTrack = () => getNextTrackFromTable?.() || null;
	});
</script>

<div class="w-full space-y-4">
	<div class="text-center">
		<button
			onclick={pickFolder}
			disabled={isLoading}
			class="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			{isLoading ? 'Loading...' : 'Pick Folder'}
		</button>
	</div>

	{#if error}
		<div class="rounded-lg border border-red-600 bg-red-900/20 p-4 text-center">
			<p class="text-red-400">Error: {error}</p>
		</div>
	{/if}

	{#if fileList.length > 0}
		<div class="flex flex-col gap-4 lg:flex-row">
			<!-- Folder Sidebar -->
			<div class="w-full lg:w-64 lg:flex-shrink-0">
				<div class="h-64 lg:h-[32rem]">
					<FolderSidebar
						folders={folderList}
						{selectedFolder}
						onFolderSelect={handleFolderSelect}
					/>
				</div>
			</div>

			<!-- Track Table -->
			<div class="min-w-0 flex-1">
				{#if selectedFolder !== null}
					<div class="mb-4 text-center text-sm text-gray-400">
						{tracks.length} tracks in {selectedFolder === ''
							? 'Root'
							: selectedFolder.split('/').pop()}
					</div>
				{/if}
				<div class="h-64 overflow-auto lg:h-[32rem]">
					<TrackTable
						{tracks}
						onTrackSelect={handleTrackSelect}
						{currentFileName}
						bind:getNextTrack={getNextTrackFromTable}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>
