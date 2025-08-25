<script lang="ts">
	import { parseBlob } from 'music-metadata';
	import { MetadataCache, type FileIdentifier } from '$lib/utils/metadataCache';

	interface TrackData {
		file: File;
		fileName: string;
		filePath: string;
		title?: string;
		artist?: string;
		album?: string;
		track?: number;
		duration?: number;
		isLoading: boolean;
		error?: string;
	}

	interface TrackTableProps {
		tracks: { file: File; fileName: string; filePath: string }[];
		onTrackSelect?: (file: File, fileName: string, filePath: string) => void;
		currentFileName?: string | null;
		getNextTrack?: () => { file: File; fileName: string; filePath: string } | null;
		getPreviousTrack?: () => { file: File; fileName: string; filePath: string } | null;
	}

	let {
		tracks = [],
		onTrackSelect,
		currentFileName = null,
		getNextTrack = $bindable(),
		getPreviousTrack = $bindable()
	}: TrackTableProps = $props();

	let trackData = $state<TrackData[]>([]);
	let sortColumn = $state<'track' | 'title' | 'artist' | 'duration'>('track');
	let sortDirection = $state<'asc' | 'desc'>('asc');

	// Extract metadata when tracks change
	$effect(() => {
		if (tracks.length > 0) {
			extractAllMetadata();
		} else {
			trackData = [];
		}
	});

	// Expose sorted track sequence to parent
	$effect(() => {
		getNextTrack = () => getNextTrackInSequence();
		getPreviousTrack = () => getPreviousTrackInSequence();
	});

	async function extractAllMetadata() {
		// Initialize track data with loading states
		trackData = tracks.map((track) => ({
			file: track.file,
			fileName: track.fileName,
			filePath: track.filePath,
			isLoading: true
		}));

		// Extract metadata for each track
		for (let i = 0; i < tracks.length; i++) {
			try {
				const track = tracks[i];
				const fileIdentifier: FileIdentifier = MetadataCache.createFileIdentifier(
					track.file,
					track.filePath
				);

				// Check cache first
				const cachedMetadata = MetadataCache.get(fileIdentifier);
				if (cachedMetadata) {
					// Use cached metadata
					trackData[i] = {
						...trackData[i],
						title: cachedMetadata.title || track.fileName.replace('.mp3', ''),
						artist: cachedMetadata.artist,
						album: cachedMetadata.album,
						track: cachedMetadata.track,
						duration: cachedMetadata.duration,
						isLoading: false
					};
				} else {
					// Extract metadata from file if not in cache
					const metadata = await parseBlob(track.file);

					const extractedMetadata = {
						title: metadata.common.title,
						artist: metadata.common.artist,
						album: metadata.common.album,
						track: metadata.common.track?.no || undefined,
						duration: metadata.format.duration
					};

					// Cache the metadata (without artwork for table view)
					MetadataCache.set(fileIdentifier, extractedMetadata);

					trackData[i] = {
						...trackData[i],
						title: extractedMetadata.title || track.fileName.replace('.mp3', ''),
						artist: extractedMetadata.artist,
						album: extractedMetadata.album,
						track: extractedMetadata.track,
						duration: extractedMetadata.duration,
						isLoading: false
					};
				}
			} catch {
				trackData[i] = {
					...trackData[i],
					title: tracks[i].fileName.replace('.mp3', ''),
					isLoading: false,
					error: 'Failed to extract metadata'
				};
			}
		}
	}

	function handleSort(column: 'track' | 'title' | 'artist' | 'duration') {
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
				case 'track':
					aValue = a.track || 999;
					bValue = b.track || 999;
					break;
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
		onTrackSelect?.(track.file, track.fileName, track.filePath);
	}

	function getNextTrackInSequence(): { file: File; fileName: string; filePath: string } | null {
		const sortedTracks = getSortedTracks();
		const currentIndex = sortedTracks.findIndex((track) => track.fileName === currentFileName);

		if (currentIndex === -1 || currentIndex === sortedTracks.length - 1) {
			return null; // No current track found or already at the end
		}

		const nextTrack = sortedTracks[currentIndex + 1];
		return { file: nextTrack.file, fileName: nextTrack.fileName, filePath: nextTrack.filePath };
	}

	function getPreviousTrackInSequence(): { file: File; fileName: string; filePath: string } | null {
		const sortedTracks = getSortedTracks();
		const currentIndex = sortedTracks.findIndex((track) => track.fileName === currentFileName);

		if (currentIndex === -1 || currentIndex === 0) {
			return null; // No current track found or already at the beginning
		}

		const previousTrack = sortedTracks[currentIndex - 1];
		return {
			file: previousTrack.file,
			fileName: previousTrack.fileName,
			filePath: previousTrack.filePath
		};
	}

	function getSortIcon(column: 'track' | 'title' | 'artist' | 'duration'): string {
		if (sortColumn !== column) return '↕️';
		return sortDirection === 'asc' ? '↑' : '↓';
	}
</script>

<div class="flex h-full w-full flex-col">
	{#if trackData.length === 0}
		<div class="flex flex-1 items-center justify-center">
			<p>No tracks loaded. Select a folder to see tracks.</p>
		</div>
	{:else}
		<div class="flex-1 overflow-auto rounded-lg border">
			<table class="w-full">
				<thead class="border-b">
					<tr>
						<th class="w-16 px-2 py-3 text-center sm:px-4">
							<button
								class="flex items-center gap-1 sm:gap-2"
								onclick={() => handleSort('track')}
								type="button"
							>
								<span class="hidden sm:inline">#</span>
								<span class="sm:hidden">#</span>
								{getSortIcon('track')}
							</button>
						</th>
						<th class="px-2 py-3 text-left sm:px-4">
							<button
								class="flex items-center gap-1 sm:gap-2"
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
								class="flex items-center gap-1 sm:gap-2"
								onclick={() => handleSort('artist')}
								type="button"
							>
								Artist {getSortIcon('artist')}
							</button>
						</th>
						<th class="px-2 py-3 text-left sm:px-4">
							<button
								class="flex items-center gap-1 sm:gap-2"
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
				<tbody class="divide-y">
					{#each getSortedTracks() as track (track.fileName)}
						<tr
							class="cursor-pointer {currentFileName === track.fileName ? 'border-l-4' : ''}"
							onclick={() => handleTrackClick(track)}
						>
							<td class="w-16 px-2 py-3 text-center sm:px-4">
								{#if track.isLoading}
									<div class="animate-pulse">
										<div class="mx-auto h-4 w-8 rounded"></div>
									</div>
								{:else}
									<div>
										{track.track || '—'}
									</div>
								{/if}
							</td>
							<td class="px-2 py-3 sm:px-4">
								{#if track.isLoading}
									<div class="flex items-center gap-2">
										<div
											class="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent sm:h-4 sm:w-4"
										></div>
										<div class="animate-pulse">
											<div class="h-4 w-24 rounded sm:w-32"></div>
										</div>
									</div>
								{:else}
									<div class="break-words">
										<div>
											{track.title || track.fileName.replace('.mp3', '')}
										</div>
										<div class="sm:hidden">
											{track.artist || '—'}
										</div>
										{#if currentFileName === track.fileName}
											<span class="ml-2">♪ Playing</span>
										{/if}
									</div>
									{#if track.error}
										<div class="mt-1">{track.error}</div>
									{/if}
								{/if}
							</td>
							<td class="hidden px-2 py-3 sm:table-cell sm:px-4">
								{#if track.isLoading}
									<div class="animate-pulse">
										<div class="h-4 w-20 rounded"></div>
									</div>
								{:else}
									<div class="break-words">
										{track.artist || '—'}
									</div>
								{/if}
							</td>
							<td class="px-2 py-3 sm:px-4">
								{#if track.isLoading}
									<div class="animate-pulse">
										<div class="h-4 w-12 rounded"></div>
									</div>
								{:else}
									<div>
										{formatDuration(track.duration)}
									</div>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="mt-2 flex flex-shrink-0 items-center justify-between">
			<div>
				{trackData.filter((track) => !track.isLoading).length} of {trackData.length} tracks loaded
			</div>
			{#if trackData.some((track) => track.isLoading)}
				<div class="flex items-center gap-2">
					<div class="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"></div>
					<span>Loading metadata...</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
