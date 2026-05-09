export function parseGithubRemote(remoteUrl: string): string | null {
	const u = remoteUrl.trim();
	if (!u) return null;

	const ssh = u.match(/^git@github\.com:([^\/]+)\/(.+?)(?:\.git)?$/);
	if (ssh) {
		return `https://github.com/${ssh[1]}/${ssh[2]}`;
	}

	const sshProto = u.match(/^ssh:\/\/git@github\.com\/([^\/]+)\/(.+?)(?:\.git)?$/);
	if (sshProto) {
		return `https://github.com/${sshProto[1]}/${sshProto[2]}`;
	}

	const https = u.match(/^https:\/\/(?:[^@\/]+@)?github\.com\/([^\/]+)\/(.+?)(?:\.git)?$/);
	if (https) {
		return `https://github.com/${https[1]}/${https[2]}`;
	}

	return null;
}

export function buildGithubBlobUrl(
	base: string,
	branch: string,
	vaultRelativePath: string
): string {
	const segments = vaultRelativePath.split("/").map(encodeURIComponent);
	return `${base}/blob/${encodeURIComponent(branch)}/${segments.join("/")}`;
}
