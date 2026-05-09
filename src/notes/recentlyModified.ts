export interface ModifiedTimeFile {
	stat: { mtime: number };
}

export interface PathFile {
	path: string;
}

export function filterRecentlyModified<F extends ModifiedTimeFile>(
	files: F[],
	sinceMs: number,
	nowMs: number
): F[] {
	const cutoff = nowMs - sinceMs;
	return files
		.filter((f) => f.stat.mtime >= cutoff)
		.sort((a, b) => b.stat.mtime - a.stat.mtime);
}

export function partitionByOpenStatus<F extends PathFile>(
	files: F[],
	openPaths: Set<string>
): { toOpen: F[]; alreadyOpen: F[] } {
	const toOpen: F[] = [];
	const alreadyOpen: F[] = [];
	for (const file of files) {
		if (openPaths.has(file.path)) {
			alreadyOpen.push(file);
		} else {
			toOpen.push(file);
		}
	}
	return { toOpen, alreadyOpen };
}
