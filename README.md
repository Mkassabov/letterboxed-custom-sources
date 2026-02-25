# Letterboxed Custom Sources

A Chrome extension that lets you add custom streaming sources to the **"Where to watch"** list on [Letterboxd](https://letterboxd.com) film pages.

![Chrome Extension](https://img.shields.io/badge/Manifest-V3-blue)

## What it does

On any Letterboxd film page (`letterboxd.com/film/*`), the extension injects your configured sources into the native "Where to watch" panel — matching Letterboxd's own styling so they look right at home alongside Apple TV, Amazon, etc.

Each source has:

- **Icon** — a URL to a favicon or logo
- **Name** — the display name shown in the list
- **Link** — where clicking the name goes (e.g. the movie's page on the source site)
- **Play link** — where the "Play" tag goes (e.g. a direct watch link)

Both link fields support `$tmdbid` as a placeholder, which gets replaced with the film's TMDB ID automatically.

## Installation

### From source (development)

```bash
# Install dependencies
bun install

# Build into dist/
bun run build

# Or watch for changes during development
bun run dev
```

Then in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Packed extension

If you have a `dist.crx` file, you can install it by dragging it onto `chrome://extensions`. You'll need developer mode enabled for sideloaded extensions.

## Usage

1. Click the extension icon → **"Manage sources"** (or right-click → Options)
2. Add a source, for example:
   - **Name:** `456Movie`
   - **Icon:** `https://456movie.nl/favicon-32x32.png`
   - **Link:** `https://456movie.nl/movie/$tmdbid`
   - **Play link:** `https://456movie.nl/movie/watch/$tmdbid`
3. Visit any Letterboxd film page — your source appears at the top of "Where to watch"

You can add as many sources as you like. They're stored in Chrome's synced storage and persist across sessions and windows.

## Project structure

```
├── manifest.json          Chrome extension manifest (Manifest V3)
├── package.json           Bun project config
├── icons/                 Extension icons (16, 48, 128 px)
├── src/
│   ├── content.js         Content script — injects sources into Letterboxd
│   ├── styles.css         Minimal CSS for injected elements
│   ├── popup.html         Extension popup UI
│   ├── popup.js           Opens the settings page from the popup
│   ├── settings.html      Settings page — add/edit/delete sources
│   └── settings.js        Settings page logic + chrome.storage.sync
├── scripts/
│   ├── build.js           Copies files into dist/ for loading in Chrome
│   ├── gen-icons.js       Generates placeholder icons (one-time utility)
│   └── convert-icon.js    Converts source images to icon PNGs (one-time utility)
└── dist/                  Built extension (load this in Chrome)
```

## Tech

- **Manifest V3** Chrome extension
- Plain JavaScript — no framework, no TypeScript, no bundler
- **Bun** as the package manager and script runner
- `chrome.storage.sync` for persistent, cross-session settings
- `MutationObserver` to handle Letterboxd's async DOM loading
