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

<div class="flex h-full w-full flex-col rounded-lg border">
	<div class="border-b p-3">
		<h3 class="uppercase">Folders</h3>
	</div>

	{#if folders.length === 0}
		<div class="flex-1 p-4 text-center">
			<p>No folders available. Select a directory first.</p>
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto">
			{#each folders as folder (folder.path)}
				<button
					class="flex w-full items-center gap-2 py-2 pr-3 text-left {selectedFolder === folder.path
						? 'border-r-2'
						: ''}"
					style="padding-left: {folder.depth * 12 + 12}px"
					onclick={() => handleFolderClick(folder)}
					type="button"
				>
					<span>{getFolderIcon(folder.depth)}</span>
					<span class="min-w-0 flex-1 break-words">{folder.name}</span>
					{#if selectedFolder === folder.path}
						<span>●</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
