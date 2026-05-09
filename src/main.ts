import { Plugin } from "obsidian";
import { registerOpenInGithub } from "./features/openInGithub";
import { registerOpenInVSCode } from "./features/openInVSCode";
import { registerOpenRecentlyModified } from "./features/openRecentlyModified";

export default class VaultToolsPlugin extends Plugin {
	async onload() {
		registerOpenInGithub(this);
		registerOpenInVSCode(this);
		registerOpenRecentlyModified(this);
	}
}
