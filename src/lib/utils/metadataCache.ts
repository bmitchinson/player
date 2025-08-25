interface CompactMetadata {
	t?: string; // title
	a?: string; // artist
	al?: string; // album
	tr?: number; // track
	d?: number; // duration
}

interface FileIdentifier {
	path: string;
	size: number;
	lastModified: number;
}

class MetadataCache {
	private static readonly CACHE_KEY = 'audio-cache-v2';

	/**
	 * Generate a compact hash key for a file
	 */
	private static generateKey(identifier: FileIdentifier): string {
		// Use a simple hash of path + size + lastModified for compactness
		const str = `${identifier.path}_${identifier.size}_${identifier.lastModified}`;
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash.toString(36); // Base36 for shorter strings
	}

	/**
	 * Get all cached data
	 */
	private static getCacheData(): Record<string, CompactMetadata> {
		try {
			const data = localStorage.getItem(this.CACHE_KEY);
			return data ? JSON.parse(data) : {};
		} catch {
			return {};
		}
	}

	/**
	 * Save all cached data
	 */
	private static saveCacheData(data: Record<string, CompactMetadata>): void {
		try {
			localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
		} catch (error) {
			console.warn('Failed to save cache:', error);
		}
	}

	/**
	 * Check if metadata exists in cache
	 */
	static has(identifier: FileIdentifier): boolean {
		const key = this.generateKey(identifier);
		const cache = this.getCacheData();
		return key in cache;
	}

	/**
	 * Get metadata from cache
	 */
	static get(identifier: FileIdentifier): CompactMetadata | null {
		const key = this.generateKey(identifier);
		const cache = this.getCacheData();
		return cache[key] || null;
	}

	/**
	 * Store metadata in cache
	 */
	static set(identifier: FileIdentifier, metadata: CompactMetadata): void {
		const key = this.generateKey(identifier);
		const cache = this.getCacheData();
		cache[key] = metadata;
		this.saveCacheData(cache);
	}

	/**
	 * Batch set multiple entries (for performance)
	 */
	static setBatch(entries: Array<{ identifier: FileIdentifier; metadata: CompactMetadata }>): void {
		const cache = this.getCacheData();
		for (const { identifier, metadata } of entries) {
			const key = this.generateKey(identifier);
			cache[key] = metadata;
		}
		this.saveCacheData(cache);
	}

	/**
	 * Clear all cache
	 */
	static clear(): void {
		try {
			localStorage.removeItem(this.CACHE_KEY);
		} catch (error) {
			console.warn('Failed to clear cache:', error);
		}
	}

	/**
	 * Get cache statistics
	 */
	static getStats(): { totalEntries: number; cacheSize: string } {
		const cache = this.getCacheData();
		const entries = Object.keys(cache).length;

		// Estimate size
		const cacheString = localStorage.getItem(this.CACHE_KEY) || '';
		const sizeInBytes = new Blob([cacheString]).size;
		const sizeInKB = (sizeInBytes / 1024).toFixed(1);

		return {
			totalEntries: entries,
			cacheSize: `${sizeInKB} KB`
		};
	}

	/**
	 * Create file identifier
	 */
	static createIdentifier(file: File, path: string): FileIdentifier {
		return {
			path,
			size: file.size,
			lastModified: file.lastModified
		};
	}

	/**
	 * Convert to full metadata format
	 */
	static expandMetadata(compact: CompactMetadata): {
		title?: string;
		artist?: string;
		album?: string;
		track?: number;
		duration?: number;
	} {
		return {
			title: compact.t,
			artist: compact.a,
			album: compact.al,
			track: compact.tr,
			duration: compact.d
		};
	}

	/**
	 * Convert from full metadata format
	 */
	static compactMetadata(metadata: {
		title?: string;
		artist?: string;
		album?: string;
		track?: number;
		duration?: number;
	}): CompactMetadata {
		const compact: CompactMetadata = {};
		if (metadata.title) compact.t = metadata.title;
		if (metadata.artist) compact.a = metadata.artist;
		if (metadata.album) compact.al = metadata.album;
		if (metadata.track) compact.tr = metadata.track;
		if (metadata.duration) compact.d = metadata.duration;
		return compact;
	}
}

export { MetadataCache, type FileIdentifier, type CompactMetadata };
