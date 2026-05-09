import { Notice, TFile } from "obsidian";
import type VaultToolsPlugin from "../main";
import {
	excludePaths,
	formatLink,
	MarkerBrokenError,
	replaceMarkerBlock,
	resolveDailyNotePath,
	startOfTodayMs,
} from "../notes/changelog";

type RunKind = "manual" | "auto";

export function registerInsertTodayChangelog(plugin: VaultToolsPlugin): void {
	let timer: ReturnType<typeof setTimeout> | null = null;

	const clearScheduled = () => {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
	};

	const scheduleAutoUpdate = () => {
		if (!plugin.settings.changelog.autoUpdate) return;
		clearScheduled();
		const delayMs =
			Math.max(1, plugin.settings.changelog.debounceSeconds) * 1000;
		timer = setTimeout(() => {
			timer = null;
			runUpdate(plugin, "auto").catch((e) => {
				console.error("[vault-tools] auto changelog update failed:", e);
			});
		}, delayMs);
	};

	plugin.addCommand({
		id: "vault-tools:insert-today-changelog",
		name: "Insert today's changelog into daily note",
		callback: () => {
			runUpdate(plugin, "manual").catch((e) => {
				console.error("[vault-tools] manual changelog update failed:", e);
			});
		},
	});

	plugin.registerEvent(
		plugin.app.vault.on("modify", (file) => {
			if (!(file instanceof TFile)) return;
			const dailyNotePath = resolveDailyNotePath(
				plugin.settings.changelog.dailyNotePathTemplate,
				new Date()
			);
			if (file.path === dailyNotePath) return;
			scheduleAutoUpdate();
		})
	);

	plugin.register(() => {
		clearScheduled();
	});
}

async function runUpdate(
	plugin: VaultToolsPlugin,
	kind: RunKind
): Promise<void> {
	const settings = plugin.settings.changelog;
	const now = new Date();
	const dailyNotePath = resolveDailyNotePath(
		settings.dailyNotePathTemplate,
		now
	);

	const dailyNote = plugin.app.vault.getAbstractFileByPath(dailyNotePath);
	if (!(dailyNote instanceof TFile)) {
		if (kind === "manual") {
			new Notice(`今日の daily note が見つかりません: ${dailyNotePath}`);
		}
		return;
	}

	const allFiles = plugin.app.vault.getMarkdownFiles();
	const excluded = excludePaths(allFiles, [
		...settings.excludePaths,
		dailyNotePath,
	]);
	const cutoff = startOfTodayMs(now);
	const recent = excluded
		.filter((f) => f.stat.mtime >= cutoff)
		.sort((a, b) => b.stat.mtime - a.stat.mtime);

	if (recent.length === 0) {
		if (kind === "manual") {
			new Notice("今日変更されたノートはありません");
		}
		return;
	}

	const lines = recent.map((file) => {
		const link = plugin.app.fileManager.generateMarkdownLink(
			file,
			dailyNotePath
		);
		return formatLink(link, file.stat.mtime, settings.linkFormat);
	});

	const content = await plugin.app.vault.read(dailyNote);
	let newContent: string;
	try {
		newContent = replaceMarkerBlock(content, settings.sectionHeading, lines);
	} catch (e) {
		if (e instanceof MarkerBrokenError) {
			if (kind === "manual") {
				new Notice(
					"changelog のマーカーが壊れています: 手動で daily note を修正してください"
				);
			}
			return;
		}
		throw e;
	}

	if (newContent === content) {
		if (kind === "manual") {
			new Notice(`changelog は最新です (${recent.length} 件)`);
		}
		return;
	}

	await plugin.app.vault.modify(dailyNote, newContent);

	if (kind === "manual") {
		new Notice(
			`${recent.length} 件の changelog を ${dailyNote.basename}.md に書き込みました`
		);
	}
}
