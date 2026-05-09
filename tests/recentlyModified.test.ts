import {
	filterRecentlyModified,
	partitionByOpenStatus,
} from "../src/notes/recentlyModified";

const FIVE_MIN = 5 * 60 * 1000;
const NOW = 1_700_000_000_000;

function f(mtime: number, path = `note-${mtime}.md`) {
	return { path, stat: { mtime } };
}

describe("filterRecentlyModified", () => {
	it("includes files modified within the window", () => {
		const files = [f(NOW - 1000), f(NOW - 60_000), f(NOW - FIVE_MIN + 1)];
		const result = filterRecentlyModified(files, FIVE_MIN, NOW);
		expect(result).toHaveLength(3);
	});

	it("excludes files older than the window", () => {
		const files = [f(NOW - FIVE_MIN - 1), f(NOW - 10 * 60 * 1000)];
		const result = filterRecentlyModified(files, FIVE_MIN, NOW);
		expect(result).toEqual([]);
	});

	it("includes the boundary value (mtime === nowMs - sinceMs)", () => {
		const files = [f(NOW - FIVE_MIN)];
		const result = filterRecentlyModified(files, FIVE_MIN, NOW);
		expect(result).toHaveLength(1);
	});

	it("returns empty array when input is empty", () => {
		expect(filterRecentlyModified([], FIVE_MIN, NOW)).toEqual([]);
	});

	it("sorts result by mtime descending (newest first)", () => {
		const files = [f(NOW - 60_000), f(NOW - 1000), f(NOW - 30_000)];
		const result = filterRecentlyModified(files, FIVE_MIN, NOW);
		expect(result.map((x) => x.stat.mtime)).toEqual([
			NOW - 1000,
			NOW - 30_000,
			NOW - 60_000,
		]);
	});

	it("mixes included and excluded files correctly", () => {
		const fresh = f(NOW - 1000, "fresh.md");
		const stale = f(NOW - 10 * 60 * 1000, "stale.md");
		const result = filterRecentlyModified([fresh, stale], FIVE_MIN, NOW);
		expect(result).toEqual([fresh]);
	});
});

describe("partitionByOpenStatus", () => {
	it("partitions files into open and not-open buckets", () => {
		const a = f(0, "a.md");
		const b = f(0, "b.md");
		const c = f(0, "c.md");
		const open = new Set(["a.md", "c.md"]);
		const { toOpen, alreadyOpen } = partitionByOpenStatus([a, b, c], open);
		expect(toOpen).toEqual([b]);
		expect(alreadyOpen).toEqual([a, c]);
	});

	it("returns all files in toOpen when openPaths is empty", () => {
		const files = [f(0, "a.md"), f(0, "b.md")];
		const { toOpen, alreadyOpen } = partitionByOpenStatus(
			files,
			new Set<string>()
		);
		expect(toOpen).toEqual(files);
		expect(alreadyOpen).toEqual([]);
	});

	it("returns all files in alreadyOpen when every path matches", () => {
		const files = [f(0, "a.md"), f(0, "b.md")];
		const { toOpen, alreadyOpen } = partitionByOpenStatus(
			files,
			new Set(["a.md", "b.md"])
		);
		expect(toOpen).toEqual([]);
		expect(alreadyOpen).toEqual(files);
	});

	it("handles empty file list", () => {
		const { toOpen, alreadyOpen } = partitionByOpenStatus(
			[],
			new Set(["a.md"])
		);
		expect(toOpen).toEqual([]);
		expect(alreadyOpen).toEqual([]);
	});

	it("preserves input order in each bucket", () => {
		const files = [f(0, "a.md"), f(0, "b.md"), f(0, "c.md"), f(0, "d.md")];
		const open = new Set(["b.md", "d.md"]);
		const { toOpen, alreadyOpen } = partitionByOpenStatus(files, open);
		expect(toOpen.map((x) => x.path)).toEqual(["a.md", "c.md"]);
		expect(alreadyOpen.map((x) => x.path)).toEqual(["b.md", "d.md"]);
	});
});
