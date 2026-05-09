import { Plugin } from "obsidian";
import { registerOpenInGithub } from "./features/openInGithub";
import { registerOpenInVSCode } from "./features/openInVSCode";

export default class VaultToolsPlugin extends Plugin {
	async onload() {
		registerOpenInGithub(this);
		registerOpenInVSCode(this);
	}
}
