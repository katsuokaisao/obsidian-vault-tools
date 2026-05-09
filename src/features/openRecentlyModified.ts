import { App, Modal, Notice, Plugin, TFile } from "obsidian";
import {
	filterRecentlyModified,
	partitionByOpenStatus,
} from "../notes/recentlyModified";

interface Preset {
	id: string;
	name: string;
	sinceMs: number;
	label: string;
}

const PRESETS: Preset[] = [
	{
		id: "open-recently-modified-5min",
		name: "Open files modified in last 5 minutes",
		sinceMs: 5 * 60 * 1000,
		label: "5 分",
	},
	{
		id: "open-recently-modified-15min",
		name: "Open files modified in last 15 minutes",
		sinceMs: 15 * 60 * 1000,
		label: "15 分",
	},
	{
		id: "open-recently-modified-60min",
		name: "Open files modified in last 60 minutes",
		sinceMs: 60 * 60 * 1000,
		label: "60 分",
	},
];

const CONFIRM_THRESHOLD = 20;

export function registerOpenRecentlyModified(plugin: Plugin): void {
	for (const preset of PRESETS) {
		plugin.addCommand({
			id: preset.id,
			name: preset.name,
			callback: () => runOpen(plugin, preset),
		});
	}
}

function runOpen(plugin: Plugin, preset: Preset): void {
	const allFiles = plugin.app.vault.getMarkdownFiles();
	const filtered = filterRecentlyModified(allFiles, preset.sinceMs, Date.now());

	if (filtered.length === 0) {
		new Notice(`直近 ${preset.label}以内に変更されたノートはありません`);
		return;
	}

	const openPaths = collectOpenFilePaths(plugin);
	const { toOpen, alreadyOpen } = partitionByOpenStatus(filtered, openPaths);

	if (toOpen.length === 0) {
		new Notice(`対象 ${filtered.length} 件はすべて既に開いています`);
		return;
	}

	if (toOpen.length > CONFIRM_THRESHOLD) {
		new ConfirmOpenModal(plugin.app, toOpen.length, () => {
			doOpen(plugin, toOpen, alreadyOpen.length);
		}).open();
		return;
	}

	doOpen(plugin, toOpen, alreadyOpen.length);
}

interface ViewWithFile {
	file?: TFile | null;
}

function collectOpenFilePaths(plugin: Plugin): Set<string> {
	const paths = new Set<string>();
	plugin.app.workspace.iterateAllLeaves((leaf) => {
		const view = leaf.view as unknown as ViewWithFile;
		if (view.file && typeof view.file.path === "string") {
			paths.add(view.file.path);
		}
	});
	return paths;
}

function doOpen(plugin: Plugin, toOpen: TFile[], skipCount: number): void {
	for (const file of toOpen) {
		plugin.app.workspace
			.getLeaf("tab")
			.openFile(file)
			.catch((e: unknown) => {
				const msg = e instanceof Error ? e.message : String(e);
				console.error(`Failed to open ${file.path}: ${msg}`);
			});
	}
	const skipMsg = skipCount > 0 ? ` / ${skipCount} 件は既に開いています` : "";
	new Notice(`${toOpen.length} 件を新しいタブで開きました${skipMsg}`);
}

class ConfirmOpenModal extends Modal {
	private readonly count: number;
	private readonly onConfirm: () => void;

	constructor(app: App, count: number, onConfirm: () => void) {
		super(app);
		this.count = count;
		this.onConfirm = onConfirm;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h3", { text: "Open multiple files" });
		contentEl.createEl("p", {
			text: `${this.count} 件のノートを新しいタブで開きます。続けますか？`,
		});

		const buttons = contentEl.createDiv({ cls: "modal-button-container" });
		const confirmBtn = buttons.createEl("button", {
			text: `開く (${this.count} 件)`,
			cls: "mod-cta",
		});
		confirmBtn.addEventListener("click", () => {
			this.close();
			this.onConfirm();
		});

		const cancelBtn = buttons.createEl("button", { text: "キャンセル" });
		cancelBtn.addEventListener("click", () => {
			this.close();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
