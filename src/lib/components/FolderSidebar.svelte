<script lang="ts">
	interface FolderItem {
		path: string;
		name: string;
		depth: number;
		isSelected: boolean;
	}

	interface FolderSidebarProps {
		folders: FolderItem[];
		onFolderSelect?: (folderPath: string) => void;
		selectedFolder?: string | null;
	}

	let { folders = [], onFolderSelect, selectedFolder = null }: FolderSidebarProps = $props();

	function handleFolderClick(folder: FolderItem) {
		onFolderSelect?.(folder.path);
	}

	function getFolderIcon(depth: number): string {
		if (depth === 0) return '📁';
		return '📂';
	}
</script>

<div class="flex h-full w-full flex-col rounded-lg border border-gray-700 bg-gray-800">
	<div class="border-b border-gray-700 p-3">
		<h3 class="text-xs font-medium tracking-wide text-gray-400 uppercase">Folders</h3>
	</div>

	{#if folders.length === 0}
		<div class="flex-1 p-4 text-center">
			<p class="text-sm text-gray-400 italic">No folders available. Select a directory first.</p>
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto">
			{#each folders as folder (folder.path)}
				<button
					class="flex w-full items-center gap-2 py-2 pr-3 text-left text-sm transition-colors hover:bg-gray-700 focus:bg-gray-600 focus:outline-none {selectedFolder ===
					folder.path
						? 'border-r-2 border-blue-400 bg-blue-900/50 text-blue-300'
						: 'text-gray-300'}"
					style="padding-left: {folder.depth * 12 + 12}px"
					onclick={() => handleFolderClick(folder)}
					type="button"
				>
					<span class="text-sm">{getFolderIcon(folder.depth)}</span>
					<span class="min-w-0 flex-1 break-words">{folder.name}</span>
					{#if selectedFolder === folder.path}
						<span class="text-xs text-blue-400">●</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
