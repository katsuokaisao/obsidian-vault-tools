#!/usr/bin/env node
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const VAULT = process.env.OBSIDIAN_VAULT ?? join(homedir(), "obsidian");
const PLUGIN_ID = "vault-tools";
const dest = join(VAULT, ".obsidian", "plugins", PLUGIN_ID);

mkdirSync(dest, { recursive: true });

const FILES = ["main.js", "manifest.json", "styles.css"];
const missing = FILES.filter((f) => !existsSync(f));
if (missing.length > 0) {
	console.error(`[install-local] missing build artifacts: ${missing.join(", ")}`);
	console.error("Run `npm run build` first.");
	process.exit(1);
}

for (const f of FILES) {
	copyFileSync(f, join(dest, f));
	console.log(`[install-local] copied ${f} -> ${join(dest, f)}`);
}

console.log("[install-local] done. Reload the plugin in Obsidian to apply.");
