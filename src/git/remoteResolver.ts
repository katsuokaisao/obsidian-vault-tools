import { execFileSync } from "child_process";
import { parseGithubRemote } from "./githubUrl";

export function resolveGithubRemote(vaultPath: string): string | null {
	try {
		const out = execFileSync(
			"git",
			["-C", vaultPath, "config", "--get", "remote.origin.url"],
			{ encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
		);
		return parseGithubRemote(out);
	} catch {
		return null;
	}
}
