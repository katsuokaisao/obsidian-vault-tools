import { parseGithubRemote, buildGithubBlobUrl } from "../src/git/githubUrl";

describe("parseGithubRemote", () => {
	it("parses SSH remote with .git suffix", () => {
		expect(parseGithubRemote("git@github.com:katsuokaisao/obsidian.git")).toBe(
			"https://github.com/katsuokaisao/obsidian"
		);
	});

	it("parses SSH remote without .git suffix", () => {
		expect(parseGithubRemote("git@github.com:katsuokaisao/obsidian")).toBe(
			"https://github.com/katsuokaisao/obsidian"
		);
	});

	it("parses ssh:// protocol form", () => {
		expect(parseGithubRemote("ssh://git@github.com/owner/repo.git")).toBe(
			"https://github.com/owner/repo"
		);
	});

	it("parses HTTPS remote with .git suffix", () => {
		expect(parseGithubRemote("https://github.com/katsuokaisao/obsidian.git")).toBe(
			"https://github.com/katsuokaisao/obsidian"
		);
	});

	it("parses HTTPS remote without .git suffix", () => {
		expect(parseGithubRemote("https://github.com/katsuokaisao/obsidian")).toBe(
			"https://github.com/katsuokaisao/obsidian"
		);
	});

	it("parses HTTPS remote with credentials embedded", () => {
		expect(parseGithubRemote("https://user@github.com/owner/repo.git")).toBe(
			"https://github.com/owner/repo"
		);
	});

	it("trims trailing newline from git output", () => {
		expect(parseGithubRemote("git@github.com:owner/repo.git\n")).toBe(
			"https://github.com/owner/repo"
		);
	});

	it("returns null for empty input", () => {
		expect(parseGithubRemote("")).toBeNull();
		expect(parseGithubRemote("\n")).toBeNull();
	});

	it("returns null for non-GitHub remote", () => {
		expect(parseGithubRemote("git@gitlab.com:owner/repo.git")).toBeNull();
		expect(parseGithubRemote("https://bitbucket.org/owner/repo.git")).toBeNull();
	});
});

describe("buildGithubBlobUrl", () => {
	it("builds blob URL for top-level file", () => {
		expect(
			buildGithubBlobUrl("https://github.com/owner/repo", "main", "README.md")
		).toBe("https://github.com/owner/repo/blob/main/README.md");
	});

	it("builds blob URL for nested path", () => {
		expect(
			buildGithubBlobUrl(
				"https://github.com/owner/repo",
				"main",
				"projects/foo/bar.md"
			)
		).toBe("https://github.com/owner/repo/blob/main/projects/foo/bar.md");
	});

	it("preserves slashes while encoding spaces in segments", () => {
		expect(
			buildGithubBlobUrl(
				"https://github.com/owner/repo",
				"main",
				"日本語/note with space.md"
			)
		).toBe(
			"https://github.com/owner/repo/blob/main/%E6%97%A5%E6%9C%AC%E8%AA%9E/note%20with%20space.md"
		);
	});

	it("encodes special characters in branch name", () => {
		expect(
			buildGithubBlobUrl("https://github.com/owner/repo", "feature/x", "a.md")
		).toBe("https://github.com/owner/repo/blob/feature%2Fx/a.md");
	});
});
