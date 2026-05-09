import { Plugin } from "obsidian";
import { registerOpenInGithub } from "./features/openInGithub";
import { registerOpenInVSCode } from "./features/openInVSCode";
import { registerOpenRecentlyModified } from "./features/openRecentlyModified";
import { registerInsertTodayChangelog } from "./features/insertTodayChangelog";
import {
	DEFAULT_SETTINGS,
	mergeSettings,
	VaultToolsSettings,
	VaultToolsSettingTab,
} from "./settings";

export default class VaultToolsPlugin extends Plugin {
	settings!: VaultToolsSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new VaultToolsSettingTab(this.app, this));

		registerOpenInGithub(this);
		registerOpenInVSCode(this);
		registerOpenRecentlyModified(this);
		registerInsertTodayChangelog(this);
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as
			| Partial<VaultToolsSettings>
			| null
			| undefined;
		this.settings = mergeSettings(DEFAULT_SETTINGS, data);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
