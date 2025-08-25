interface CachedMetadata {
	title?: string;
	album?: string;
	artist?: string;
	track?: number;
	duration?: number;
	artwork?: string;
	// Cache metadata
	cacheKey: string;
	lastModified: number;
	fileSize: number;
	timestamp: number;
}

interface FileIdentifier {
	path: string;
	lastModified: number;
	size: number;
}

class MetadataCache {
	private static readonly CACHE_KEY = 'audio-metadata-cache';
	private static readonly CACHE_VERSION = '1.0';

	/**
	 * Generate a cache key for a file based on its path, size, and last modified date
	 */
	private static generateCacheKey(identifier: FileIdentifier): string {
		return `${identifier.path}_${identifier.size}_${identifier.lastModified}`;
	}

	/**
	 * Get all cached metadata from localStorage
	 */
	private static getAllCachedData(): Record<string, CachedMetadata> {
		try {
			const data = localStorage.getItem(this.CACHE_KEY);
			if (!data) return {};

			const parsed = JSON.parse(data);
			if (parsed.version !== this.CACHE_VERSION) {
				// Clear cache if version mismatch
				this.clearCache();
				return {};
			}

			return parsed.metadata || {};
		} catch (error) {
			console.warn('Failed to parse metadata cache:', error);
			this.clearCache();
			return {};
		}
	}

	/**
	 * Save all cached metadata to localStorage
	 */
	private static saveAllCachedData(data: Record<string, CachedMetadata>): void {
		try {
			const cacheObject = {
				version: this.CACHE_VERSION,
				metadata: data
			};

			localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheObject));
		} catch (error) {
			console.warn('Failed to save metadata cache:', error);
		}
	}

	/**
	 * Check if metadata exists in cache for a given file
	 */
	static has(identifier: FileIdentifier): boolean {
		const cacheKey = this.generateCacheKey(identifier);
		const allData = this.getAllCachedData();
		return cacheKey in allData;
	}

	/**
	 * Get cached metadata for a file
	 */
	static get(identifier: FileIdentifier): CachedMetadata | null {
		const cacheKey = this.generateCacheKey(identifier);
		const allData = this.getAllCachedData();
		const cached = allData[cacheKey];

		if (!cached) return null;

		return cached;
	}

	/**
	 * Store metadata in cache for a file
	 */
	static set(
		identifier: FileIdentifier,
		metadata: Omit<CachedMetadata, 'cacheKey' | 'lastModified' | 'fileSize' | 'timestamp'>
	): void {
		const cacheKey = this.generateCacheKey(identifier);
		const allData = this.getAllCachedData();

		// Clean up any existing entry for this file first
		const existingEntry = allData[cacheKey];
		if (existingEntry?.artwork) {
			URL.revokeObjectURL(existingEntry.artwork);
		}

		const cachedMetadata: CachedMetadata = {
			...metadata,
			cacheKey,
			lastModified: identifier.lastModified,
			fileSize: identifier.size,
			timestamp: Date.now()
		};

		allData[cacheKey] = cachedMetadata;
		this.saveAllCachedData(allData);
	}

	/**
	 * Delete cached metadata for a file
	 */
	static delete(identifier: FileIdentifier): void {
		const cacheKey = this.generateCacheKey(identifier);
		const allData = this.getAllCachedData();

		const cached = allData[cacheKey];
		if (cached?.artwork) {
			URL.revokeObjectURL(cached.artwork);
		}

		delete allData[cacheKey];
		this.saveAllCachedData(allData);
	}

	/**
	 * Clear all cached metadata
	 */
	static clearCache(): void {
		try {
			// Clean up all blob URLs first
			const allData = this.getAllCachedData();
			for (const metadata of Object.values(allData)) {
				if (metadata.artwork) {
					URL.revokeObjectURL(metadata.artwork);
				}
			}

			localStorage.removeItem(this.CACHE_KEY);
		} catch (error) {
			console.warn('Failed to clear metadata cache:', error);
		}
	}

	/**
	 * Get cache statistics
	 */
	static getStats(): { totalEntries: number; cacheSize: string; oldestEntry: number | null } {
		const allData = this.getAllCachedData();
		const entries = Object.values(allData);

		let oldestTimestamp: number | null = null;
		if (entries.length > 0) {
			oldestTimestamp = Math.min(...entries.map((e) => e.timestamp));
		}

		// Estimate cache size (rough approximation)
		const cacheString = localStorage.getItem(this.CACHE_KEY) || '';
		const sizeInBytes = new Blob([cacheString]).size;
		const sizeInKB = (sizeInBytes / 1024).toFixed(2);

		return {
			totalEntries: entries.length,
			cacheSize: `${sizeInKB} KB`,
			oldestEntry: oldestTimestamp
		};
	}

	/**
	 * Get all cached entries for files within a specific folder path
	 * This enables the recursive functionality where loading a parent folder
	 * can benefit from cache entries when later loading subfolders
	 */
	static getCachedEntriesForFolder(folderPath: string): Record<string, CachedMetadata> {
		const allData = this.getAllCachedData();
		const folderEntries: Record<string, CachedMetadata> = {};

		for (const [cacheKey, metadata] of Object.entries(allData)) {
			// Extract the file path from the cache key (remove size and lastModified parts)
			const pathMatch = cacheKey.match(/^(.+)_\d+_\d+$/);
			if (pathMatch) {
				const filePath = pathMatch[1];

				// Check if this file is within the specified folder
				if (folderPath === '' || filePath.startsWith(folderPath + '/') || filePath === folderPath) {
					folderEntries[filePath] = metadata;
				}
			}
		}

		return folderEntries;
	}

	/**
	 * Create a file identifier from a File object and its path
	 */
	static createFileIdentifier(file: File, path: string): FileIdentifier {
		return {
			path,
			lastModified: file.lastModified,
			size: file.size
		};
	}
}

export { MetadataCache, type CachedMetadata, type FileIdentifier };
