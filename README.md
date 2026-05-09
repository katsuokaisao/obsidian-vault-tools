# obsidian-vault-tools

Personal utility plugin for my Obsidian vault. Currently provides:

- **Open in GitHub** — adds an "Open in GitHub" item to the file explorer right-click menu. The current note is opened on the `main` branch of the vault's `origin` remote.

Desktop only. The GitHub remote URL is detected from `git config --get remote.origin.url` at runtime.

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
  main.ts                  Plugin entry
  features/openInGithub.ts file-menu item registration
  git/githubUrl.ts         pure parsers and URL builder
  git/remoteResolver.ts    git config wrapper
tests/
  githubUrl.test.ts
```

## Acknowledgments

The build setup (esbuild config, `manifest.json` shape, `tsconfig.json`,
`isDesktopOnly` handling) is adapted from the official
[obsidianmd/obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin),
which is distributed under the MIT License.

## License

MIT
