// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Environment variables
	interface ImportMetaEnv {
		readonly PUBLIC_COMMIT_SHA: string;
	}

	// File System Access API types
	interface FileSystemHandle {
		kind: 'file' | 'directory';
		name: string;
	}

	interface FileSystemFileHandle extends FileSystemHandle {
		kind: 'file';
		getFile(): Promise<File>;
	}

	interface FileSystemDirectoryHandle extends FileSystemHandle {
		kind: 'directory';
		entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
		getDirectoryHandle(
			name: string,
			options?: { create?: boolean }
		): Promise<FileSystemDirectoryHandle>;
		getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
	}

	interface Window {
		showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
		showOpenFilePicker(): Promise<FileSystemFileHandle[]>;
		showSaveFilePicker(): Promise<FileSystemFileHandle>;
	}
}

export {};
