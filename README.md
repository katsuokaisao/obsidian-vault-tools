# obsidian-vault-tools

Personal utility plugin for my Obsidian vault. Currently provides:

- **Open in GitHub** — adds an "Open in GitHub" item to the file explorer right-click menu. The current note is opened on the `main` branch of the vault's `origin` remote. The GitHub remote URL is detected from `git config --get remote.origin.url` at runtime.
- **Open in VSCode** — adds an "Open in VSCode" item to the file explorer right-click menu. On macOS the file is launched via `/usr/bin/open -a "Visual Studio Code"`; on other platforms via the `code` command on `PATH`.
- **Open Recently Modified Files** — three command-palette commands ("Open files modified in last {5,15,60} minutes") that bulk-open every Markdown file modified within the chosen window in new tabs. Already-open files are skipped to avoid duplicate tabs. If more than 20 files would be opened, a confirm modal is shown.
- **Insert Today's Changelog** — writes a wiki-link list of every Markdown file modified today (since 0:00) into a configurable section of the daily note. Idempotent (re-running replaces only the marked block). Updates automatically with debounce when files change, plus a manual command palette entry. Six settings (auto-update, debounce, daily note path template, section heading, link format, exclude paths) are exposed in a settings tab.

Desktop only.

## Install (local development)

```bash
npm install
npm run build
npm run install-local
```

`install-local` copies `main.js`, `manifest.json`, `styles.css` into `~/obsidian/.obsidian/plugins/vault-tools/`. Override the destination vault with `OBSIDIAN_VAULT=/path/to/vault npm run install-local`.

After copying, reload the plugin in Obsidian (Settings → Community plugins → toggle off and on).

## Develop

```bash
npm run dev   # esbuild watch
npm test      # jest
```

## Layout

```
src/
  main.ts                              Plugin entry — settings lifecycle + feature registration
  settings.ts                          VaultToolsSettings + DEFAULT_SETTINGS + SettingTab
  features/openInGithub.ts             file-menu item: open current note on GitHub
  features/openInVSCode.ts             file-menu item: open current note in VSCode
  features/openRecentlyModified.ts     command palette: bulk-open recently modified notes
  features/insertTodayChangelog.ts     command + event-driven auto-update for daily note changelog
  git/githubUrl.ts                     pure parsers and URL builder
  git/remoteResolver.ts                git config wrapper
  notes/recentlyModified.ts            pure helpers: filter by mtime, partition by open status
  notes/changelog.ts                   pure helpers: exclude/sort/format/idempotent marker block
tests/
  githubUrl.test.ts
  recentlyModified.test.ts
  changelog.test.ts
```

## Acknowledgments

The build setup (esbuild config, `manifest.json` shape, `tsconfig.json`,
`isDesktopOnly` handling) is adapted from the official
[obsidianmd/obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin),
which is distributed under the MIT License.

## License

MIT
