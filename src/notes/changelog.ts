export interface PathFile {
	path: string;
}

export interface MtimeFile {
	stat: { mtime: number };
}

export type LinkFormat =
	| "basename"
	| "timestamped-prefix"
	| "timestamped-suffix";

export class MarkerBrokenError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MarkerBrokenError";
	}
}

export const MARKER_START = "<!-- vault-tools:changelog:start -->";
export const MARKER_END = "<!-- vault-tools:changelog:end -->";

export function excludePaths<F extends PathFile>(
	files: F[],
	excludePrefixes: string[]
): F[] {
	const prefixes = excludePrefixes.filter((p) => p.length > 0);
	if (prefixes.length === 0) return files;
	return files.filter(
		(f) => !prefixes.some((p) => f.path === p || f.path.startsWith(p))
	);
}

export function startOfTodayMs(now: Date): number {
	const d = new Date(now.getTime());
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

export function resolveDailyNotePath(template: string, now: Date): string {
	const yyyy = String(now.getFullYear());
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const dd = String(now.getDate()).padStart(2, "0");
	return template
		.replace(/YYYY-MM-DD/g, `${yyyy}-${mm}-${dd}`)
		.replace(/YYYY/g, yyyy)
		.replace(/MM/g, mm)
		.replace(/DD/g, dd);
}

function formatTime(mtimeMs: number): string {
	const d = new Date(mtimeMs);
	const hh = String(d.getHours()).padStart(2, "0");
	const mm = String(d.getMinutes()).padStart(2, "0");
	return `${hh}:${mm}`;
}

export function formatLink(
	link: string,
	mtimeMs: number,
	format: LinkFormat
): string {
	if (format === "timestamped-prefix") {
		return `- ${formatTime(mtimeMs)} ${link}`;
	}
	if (format === "timestamped-suffix") {
		return `- ${link} (${formatTime(mtimeMs)})`;
	}
	return `- ${link}`;
}

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function replaceMarkerBlock(
	markdown: string,
	sectionHeading: string,
	bodyLines: string[]
): string {
	const body = bodyLines.join("\n");
	const newMarkerBlock = `${MARKER_START}\n${body}\n${MARKER_END}`;

	const startIdx = markdown.indexOf(MARKER_START);
	const endIdx = markdown.indexOf(MARKER_END);

	if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
		const before = markdown.substring(0, startIdx);
		const after = markdown.substring(endIdx + MARKER_END.length);
		return before + newMarkerBlock + after;
	}

	if (startIdx !== -1 || endIdx !== -1) {
		throw new MarkerBrokenError(
			"changelog markers are broken or out of order in the daily note"
		);
	}

	const headingPattern = new RegExp(`^${escapeRegex(sectionHeading)}$`, "m");
	if (headingPattern.test(markdown)) {
		throw new MarkerBrokenError(
			`section "${sectionHeading}" exists but no changelog markers found`
		);
	}

	const stripped = markdown.replace(/\n*$/, "");
	const separator = stripped === "" ? "" : "\n\n";
	return `${stripped}${separator}${sectionHeading}\n\n${newMarkerBlock}\n`;
}
