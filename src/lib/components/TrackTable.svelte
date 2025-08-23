<script lang="ts">
	import { parseBlob } from 'music-metadata';

	interface TrackData {
		file: File;
		fileName: string;
		title?: string;
		artist?: string;
		duration?: number;
		isLoading: boolean;
		error?: string;
	}

	interface TrackTableProps {
		tracks: { file: File; fileName: string }[];
		onTrackSelect?: (file: File, fileName: string) => void;
		currentFileName?: string | null;
	}

	let { tracks = [], onTrackSelect, currentFileName = null }: TrackTableProps = $props();

	let trackData = $state<TrackData[]>([]);
	let sortColumn = $state<'title' | 'artist' | 'duration'>('title');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	// Extract metadata when tracks change
	$effect(() => {
		if (tracks.length > 0) {
			extractAllMetadata();
		} else {
			trackData = [];
		}
	});

	async function extractAllMetadata() {
		// Initialize track data with loading states
		trackData = tracks.map((track) => ({
			file: track.file,
			fileName: track.fileName,
			isLoading: true
		}));

		// Extract metadata for each track
		for (let i = 0; i < tracks.length; i++) {
			try {
				const metadata = await parseBlob(tracks[i].file);
				trackData[i] = {
					...trackData[i],
					title: metadata.common.title || tracks[i].fileName.replace('.mp3', ''),
					artist: metadata.common.artist,
					duration: metadata.format.duration,
					isLoading: false
				};
			} catch (error) {
				trackData[i] = {
					...trackData[i],
					title: tracks[i].fileName.replace('.mp3', ''),
					isLoading: false,
					error: 'Failed to extract metadata'
				};
			}
		}
	}

	function handleSort(column: 'title' | 'artist' | 'duration') {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	function formatDuration(seconds?: number): string {
		if (!seconds) return '--:--';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function getSortedTracks(): TrackData[] {
		return [...trackData].sort((a, b) => {
			let aValue: string | number | undefined;
			let bValue: string | number | undefined;

			switch (sortColumn) {
				case 'title':
					aValue = a.title?.toLowerCase() || '';
					bValue = b.title?.toLowerCase() || '';
					break;
				case 'artist':
					aValue = a.artist?.toLowerCase() || '';
					bValue = b.artist?.toLowerCase() || '';
					break;
				case 'duration':
					aValue = a.duration || 0;
					bValue = b.duration || 0;
					break;
			}

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return sortDirection === 'asc'
					? aValue.localeCompare(bValue)
					: bValue.localeCompare(aValue);
			} else if (typeof aValue === 'number' && typeof bValue === 'number') {
				return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
			}

			return 0;
		});
	}

	function handleTrackClick(track: TrackData) {
		onTrackSelect?.(track.file, track.fileName);
	}

	function getSortIcon(column: 'title' | 'artist' | 'duration'): string {
		if (sortColumn !== column) return '↕️';
		return sortDirection === 'asc' ? '↑' : '↓';
	}
</script>

<div class="w-full">
	{#if trackData.length === 0}
		<div class="py-8 text-center">
			<p class="text-gray-500">No tracks loaded. Select a folder to see tracks.</p>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-gray-200">
			<table class="w-full bg-white">
				<thead class="border-b border-gray-200 bg-gray-50">
					<tr>
						<th class="px-2 py-3 text-left sm:px-4">
							<button
								class="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 focus:outline-none sm:gap-2 sm:text-sm"
								onclick={() => handleSort('title')}
								type="button"
							>
								<span class="hidden sm:inline">Title</span>
								<span class="sm:hidden">Title</span>
								{getSortIcon('title')}
							</button>
						</th>
						<th class="hidden px-2 py-3 text-left sm:table-cell sm:px-4">
							<button
								class="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 focus:outline-none sm:gap-2 sm:text-sm"
								onclick={() => handleSort('artist')}
								type="button"
							>
								Artist {getSortIcon('artist')}
							</button>
						</th>
						<th class="px-2 py-3 text-left sm:px-4">
							<button
								class="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 focus:outline-none sm:gap-2 sm:text-sm"
								onclick={() => handleSort('duration')}
								type="button"
							>
								<span class="hidden sm:inline">Length</span>
								<span class="sm:hidden">Time</span>
								{getSortIcon('duration')}
							</button>
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each getSortedTracks() as track (track.fileName)}
						<tr
							class="cursor-pointer transition-colors hover:bg-gray-50 {currentFileName ===
							track.fileName
								? 'border-l-4 border-blue-400 bg-blue-50'
								: ''}"
							onclick={() => handleTrackClick(track)}
						>
							<td class="px-2 py-3 sm:px-4">
								{#if track.isLoading}
									<div class="flex items-center gap-2">
										<div
											class="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent sm:h-4 sm:w-4"
										></div>
										<div class="animate-pulse">
											<div class="h-4 w-24 rounded bg-gray-300 sm:w-32"></div>
										</div>
									</div>
								{:else}
									<div class="font-medium break-words text-gray-900">
										<div class="text-sm sm:text-base">
											{track.title || track.fileName.replace('.mp3', '')}
										</div>
										<div class="text-xs text-gray-500 sm:hidden">
											{track.artist || '—'}
										</div>
										{#if currentFileName === track.fileName}
											<span class="ml-2 text-xs text-blue-500">♪ Playing</span>
										{/if}
									</div>
									{#if track.error}
										<div class="mt-1 text-xs text-red-500">{track.error}</div>
									{/if}
								{/if}
							</td>
							<td class="hidden px-2 py-3 sm:table-cell sm:px-4">
								{#if track.isLoading}
									<div class="animate-pulse">
										<div class="h-4 w-20 rounded bg-gray-300"></div>
									</div>
								{:else}
									<div class="break-words text-gray-700">
										{track.artist || '—'}
									</div>
								{/if}
							</td>
							<td class="px-2 py-3 sm:px-4">
								{#if track.isLoading}
									<div class="animate-pulse">
										<div class="h-4 w-12 rounded bg-gray-300"></div>
									</div>
								{:else}
									<div class="font-mono text-xs text-gray-600 sm:text-sm">
										{formatDuration(track.duration)}
									</div>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="mt-4 flex items-center justify-between text-sm text-gray-600">
			<div>
				{trackData.filter((track) => !track.isLoading).length} of {trackData.length} tracks loaded
			</div>
			{#if trackData.some((track) => track.isLoading)}
				<div class="flex items-center gap-2">
					<div
						class="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
					></div>
					<span>Loading metadata...</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
