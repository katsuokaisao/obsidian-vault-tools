import { App, PluginSettingTab, Setting } from "obsidian";
import type { LinkFormat } from "./notes/changelog";
import type VaultToolsPlugin from "./main";

export interface ChangelogSettings {
	excludePaths: string[];
	dailyNotePathTemplate: string;
	sectionHeading: string;
	linkFormat: LinkFormat;
	autoUpdate: boolean;
	debounceSeconds: number;
}

export interface VaultToolsSettings {
	changelog: ChangelogSettings;
}

export const DEFAULT_SETTINGS: VaultToolsSettings = {
	changelog: {
		excludePaths: ["log/", "Clippings/"],
		dailyNotePathTemplate: "log/daily/YYYY/MM/YYYY-MM-DD.md",
		sectionHeading: "## 本日の変更ファイル",
		linkFormat: "basename",
		autoUpdate: true,
		debounceSeconds: 30,
	},
};

export function mergeSettings(
	defaults: VaultToolsSettings,
	loaded: Partial<VaultToolsSettings> | null | undefined
): VaultToolsSettings {
	return {
		changelog: { ...defaults.changelog, ...(loaded?.changelog ?? {}) },
	};
}

export class VaultToolsSettingTab extends PluginSettingTab {
	private readonly plugin: VaultToolsPlugin;

	constructor(app: App, plugin: VaultToolsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h3", { text: "Insert Today's Changelog" });

		new Setting(containerEl)
			.setName("Auto-update")
			.setDesc(
				"Update changelog automatically when other files are modified."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.changelog.autoUpdate)
					.onChange(async (value) => {
						this.plugin.settings.changelog.autoUpdate = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Debounce seconds")
			.setDesc(
				"Wait this many seconds after the last modification before updating (only when Auto-update is on)."
			)
			.addText((text) => {
				text
					.setValue(String(this.plugin.settings.changelog.debounceSeconds))
					.onChange(async (value) => {
						const n = Number(value);
						if (Number.isFinite(n) && n >= 1) {
							this.plugin.settings.changelog.debounceSeconds = n;
							await this.plugin.saveSettings();
						}
					});
			});

		new Setting(containerEl)
			.setName("Daily note path template")
			.setDesc(
				"Tokens: YYYY (year), MM (month, zero-padded), DD (day, zero-padded). Example: log/daily/YYYY/MM/YYYY-MM-DD.md"
			)
			.addText((text) => {
				text
					.setValue(this.plugin.settings.changelog.dailyNotePathTemplate)
					.onChange(async (value) => {
						this.plugin.settings.changelog.dailyNotePathTemplate = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Section heading")
			.setDesc("Markdown heading where the changelog block is inserted.")
			.addText((text) => {
				text
					.setValue(this.plugin.settings.changelog.sectionHeading)
					.onChange(async (value) => {
						this.plugin.settings.changelog.sectionHeading = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Link format")
			.setDesc("How each file appears in the changelog.")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("basename", "[[note]]")
					.addOption("timestamped-prefix", "HH:MM [[note]]")
					.addOption("timestamped-suffix", "[[note]] (HH:MM)")
					.setValue(this.plugin.settings.changelog.linkFormat)
					.onChange(async (value) => {
						this.plugin.settings.changelog.linkFormat = value as LinkFormat;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Exclude paths")
			.setDesc(
				"Paths to exclude (one per line, prefix match). Daily note self is always excluded automatically."
			)
			.addTextArea((textarea) => {
				textarea
					.setValue(this.plugin.settings.changelog.excludePaths.join("\n"))
					.onChange(async (value) => {
						this.plugin.settings.changelog.excludePaths = value
							.split("\n")
							.map((s) => s.trim())
							.filter((s) => s.length > 0);
						await this.plugin.saveSettings();
					});
				textarea.inputEl.rows = 4;
				textarea.inputEl.cols = 40;
			});
	}
}
