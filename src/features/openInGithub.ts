import { FileSystemAdapter, Notice, Plugin, TFile } from "obsidian";
import { resolveGithubRemote } from "../git/remoteResolver";
import { buildGithubBlobUrl } from "../git/githubUrl";

const BRANCH = "main";

export function registerOpenInGithub(plugin: Plugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on("file-menu", (menu, file) => {
			if (!(file instanceof TFile)) return;
			menu.addItem((item) => {
				item
					.setTitle("Open in GitHub")
					.setIcon("github")
					.onClick(() => openOnGithub(plugin, file));
			});
		})
	);
}

function openOnGithub(plugin: Plugin, file: TFile): void {
	const adapter = plugin.app.vault.adapter;
	if (!(adapter instanceof FileSystemAdapter)) {
		new Notice("Vault adapter is not a FileSystemAdapter.");
		return;
	}
	const vaultPath = adapter.getBasePath();
	const base = resolveGithubRemote(vaultPath);
	if (!base) {
		new Notice("Failed to detect GitHub remote (origin) for this vault.");
		return;
	}
	const url = buildGithubBlobUrl(base, BRANCH, file.path);
	window.open(url, "_blank");
}
