import { spawn } from "child_process";
import { FileSystemAdapter, Notice, Plugin, TFile } from "obsidian";

export function registerOpenInVSCode(plugin: Plugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on("file-menu", (menu, file) => {
			if (!(file instanceof TFile)) return;
			menu.addItem((item) => {
				item
					.setTitle("Open in VSCode")
					.setIcon("code")
					.onClick(() => openInVSCode(plugin, file));
			});
		})
	);
}

function openInVSCode(plugin: Plugin, file: TFile): void {
	const adapter = plugin.app.vault.adapter;
	if (!(adapter instanceof FileSystemAdapter)) {
		new Notice("Vault adapter is not a FileSystemAdapter.");
		return;
	}
	const absolutePath = adapter.getFullPath(file.path);
	const { command, args } = buildOpenCommand(absolutePath);
	try {
		const child = spawn(command, args, {
			detached: true,
			stdio: "ignore",
		});
		child.on("error", (err) => {
			new Notice(`Failed to open in VSCode: ${err.message}`);
		});
		child.unref();
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		new Notice(`Failed to open in VSCode: ${msg}`);
	}
}

function buildOpenCommand(absolutePath: string): {
	command: string;
	args: string[];
} {
	if (process.platform === "darwin") {
		return {
			command: "/usr/bin/open",
			args: ["-a", "Visual Studio Code", absolutePath],
		};
	}
	return { command: "code", args: [absolutePath] };
}
