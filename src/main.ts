import { Plugin } from "obsidian";
import { registerOpenInGithub } from "./features/openInGithub";

export default class VaultToolsPlugin extends Plugin {
	async onload() {
		registerOpenInGithub(this);
	}
}
