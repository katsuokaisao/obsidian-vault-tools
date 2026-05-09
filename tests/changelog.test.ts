import {
	excludePaths,
	startOfTodayMs,
	resolveDailyNotePath,
	formatLink,
	replaceMarkerBlock,
	MarkerBrokenError,
	MARKER_START,
	MARKER_END,
} from "../src/notes/changelog";

const f = (path: string) => ({ path });

describe("excludePaths", () => {
	it("returns all files when prefixes is empty", () => {
		expect(excludePaths([f("a.md"), f("b.md")], [])).toEqual([
			f("a.md"),
			f("b.md"),
		]);
	});

	it("filters out files matching any prefix", () => {
		const result = excludePaths(
			[f("log/daily/x.md"), f("projects/foo.md"), f("Clippings/y.md")],
			["log/", "Clippings/"]
		);
		expect(result).toEqual([f("projects/foo.md")]);
	});

	it("excludes exact path match", () => {
		expect(excludePaths([f("note.md"), f("other.md")], ["note.md"])).toEqual([
			f("other.md"),
		]);
	});

	it("ignores empty-string prefixes", () => {
		expect(excludePaths([f("a.md"), f("b.md")], [""])).toEqual([
			f("a.md"),
			f("b.md"),
		]);
	});

	it("excludes daily note self when its full path is given", () => {
		const result = excludePaths(
			[f("log/daily/2026/05/2026-05-09.md"), f("projects/foo.md")],
			["log/daily/2026/05/2026-05-09.md"]
		);
		expect(result).toEqual([f("projects/foo.md")]);
	});
});

describe("startOfTodayMs", () => {
	it("returns 0:00:00.000 of the given date in local time", () => {
		const now = new Date(2026, 4, 9, 13, 54, 30, 500);
		const result = startOfTodayMs(now);
		const expected = new Date(2026, 4, 9, 0, 0, 0, 0).getTime();
		expect(result).toBe(expected);
	});

	it("does not mutate the input Date", () => {
		const now = new Date(2026, 4, 9, 13, 54, 30);
		const before = now.getTime();
		startOfTodayMs(now);
		expect(now.getTime()).toBe(before);
	});
});

describe("resolveDailyNotePath", () => {
	it("replaces YYYY/MM/DD tokens with zero-padded values", () => {
		const result = resolveDailyNotePath(
			"log/daily/YYYY/MM/YYYY-MM-DD.md",
			new Date(2026, 4, 9)
		);
		expect(result).toBe("log/daily/2026/05/2026-05-09.md");
	});

	it("zero-pads single-digit month and day", () => {
		const result = resolveDailyNotePath("YYYY-MM-DD.md", new Date(2026, 0, 1));
		expect(result).toBe("2026-01-01.md");
	});

	it("processes YYYY-MM-DD as a single token (longer first)", () => {
		const result = resolveDailyNotePath(
			"prefix-YYYY-MM-DD-YYYY.md",
			new Date(2026, 4, 9)
		);
		expect(result).toBe("prefix-2026-05-09-2026.md");
	});

	it("handles year-end and year-start dates", () => {
		expect(
			resolveDailyNotePath("YYYY/MM/DD.md", new Date(2025, 11, 31))
		).toBe("2025/12/31.md");
		expect(
			resolveDailyNotePath("YYYY/MM/DD.md", new Date(2026, 0, 1))
		).toBe("2026/01/01.md");
	});
});

describe("formatLink", () => {
	const link = "[[note]]";
	const mtime = new Date(2026, 4, 9, 13, 54).getTime();

	it("basename: link only", () => {
		expect(formatLink(link, mtime, "basename")).toBe("- [[note]]");
	});

	it("timestamped-prefix: HH:MM before link", () => {
		expect(formatLink(link, mtime, "timestamped-prefix")).toBe(
			"- 13:54 [[note]]"
		);
	});

	it("timestamped-suffix: HH:MM in parens after link", () => {
		expect(formatLink(link, mtime, "timestamped-suffix")).toBe(
			"- [[note]] (13:54)"
		);
	});

	it("zero-pads single-digit hours and minutes", () => {
		const earlyMtime = new Date(2026, 4, 9, 5, 7).getTime();
		expect(formatLink(link, earlyMtime, "timestamped-prefix")).toBe(
			"- 05:07 [[note]]"
		);
	});
});

describe("replaceMarkerBlock", () => {
	const heading = "## 本日の変更ファイル";

	it("appends section + markers when neither exist (non-empty input)", () => {
		const md = "# title\n\n## log\n\nentry\n";
		const result = replaceMarkerBlock(md, heading, ["- [[a]]", "- [[b]]"]);
		expect(result).toContain("# title");
		expect(result).toContain("## log");
		expect(result).toContain(heading);
		expect(result).toContain(MARKER_START);
		expect(result).toContain("- [[a]]");
		expect(result).toContain("- [[b]]");
		expect(result).toContain(MARKER_END);
		expect(result.endsWith("\n")).toBe(true);
	});

	it("appends to empty input without leading blank lines", () => {
		const result = replaceMarkerBlock("", heading, ["- [[a]]"]);
		expect(result.startsWith(heading)).toBe(true);
	});

	it("normalizes multiple trailing newlines before appending", () => {
		const md = "# title\n\n\n\n";
		const result = replaceMarkerBlock(md, heading, ["- [[a]]"]);
		expect(result).toContain("# title\n\n## 本日の変更ファイル");
	});

	it("replaces marker block when both markers exist", () => {
		const md = `# title\n\n${heading}\n\n${MARKER_START}\n- [[old]]\n${MARKER_END}\n`;
		const result = replaceMarkerBlock(md, heading, ["- [[new]]"]);
		expect(result).not.toContain("[[old]]");
		expect(result).toContain("- [[new]]");
		const headingCount = (result.match(/## 本日の変更ファイル/g) ?? []).length;
		expect(headingCount).toBe(1);
	});

	it("preserves content surrounding the marker block on replace", () => {
		const md = `# title\n\n${heading}\n\n${MARKER_START}\n- [[old]]\n${MARKER_END}\n\n## next section\nbody\n`;
		const result = replaceMarkerBlock(md, heading, ["- [[new]]"]);
		expect(result).toContain("# title");
		expect(result).toContain("## next section");
		expect(result).toContain("body");
		expect(result).toContain("- [[new]]");
	});

	it("throws MarkerBrokenError when only the start marker exists", () => {
		const md = `${heading}\n${MARKER_START}\n- [[a]]\n`;
		expect(() => replaceMarkerBlock(md, heading, ["- [[b]]"])).toThrow(
			MarkerBrokenError
		);
	});

	it("throws MarkerBrokenError when only the end marker exists", () => {
		const md = `${heading}\n- [[a]]\n${MARKER_END}\n`;
		expect(() => replaceMarkerBlock(md, heading, ["- [[b]]"])).toThrow(
			MarkerBrokenError
		);
	});

	it("throws MarkerBrokenError when section heading exists without markers", () => {
		const md = `# title\n${heading}\n- [[manual entry]]\n`;
		expect(() => replaceMarkerBlock(md, heading, ["- [[a]]"])).toThrow(
			MarkerBrokenError
		);
	});

	it("throws when markers exist in wrong order", () => {
		const md = `${heading}\n${MARKER_END}\n${MARKER_START}\n`;
		expect(() => replaceMarkerBlock(md, heading, ["- [[a]]"])).toThrow(
			MarkerBrokenError
		);
	});

	it("handles empty body lines (writes empty marker block)", () => {
		const md = "# title\n";
		const result = replaceMarkerBlock(md, heading, []);
		expect(result).toContain(`${MARKER_START}\n\n${MARKER_END}`);
	});

	it("escapes regex-special characters in section heading", () => {
		const specialHeading = "## Today's notes (auto)";
		const md = `# title\n${specialHeading}\n- manual\n`;
		expect(() => replaceMarkerBlock(md, specialHeading, ["- [[a]]"])).toThrow(
			MarkerBrokenError
		);
	});
});
