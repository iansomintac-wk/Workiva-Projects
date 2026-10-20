# Hosting the OSM Runway tracker

This page is written so it can go to whoever runs the host, unchanged. Nothing in this repository publishes anything.

## What this is

The tracker is one HTML file. It runs in the browser. The book (accounts, activities, call transcripts) lives in this browser's own storage for the address the page is opened from: a copy opened as a file and a copy opened from a web address each have their own, separate, empty-to-start book. The tracker does not send the book to a server. The AI features are the exception: when someone enters an AI key in Settings and uses an AI feature, the text they ask about is sent to the AI provider they configured (Anthropic, OpenAI or Gemini), and nowhere else. The page itself needs network access to a few outside hosts to load its fonts and its spreadsheet-reading script (listed under "What the page loads"). The spreadsheet importers need that script (the page checks for it and does not import without it).

## What to upload

Exactly two files, made by `node tools/build-site.mjs` into the `site/` folder: `site/index.html` (a byte-for-byte copy of the 1.1 tracker) and `site/.nojekyll` (an empty file; GitHub Pages serves files as they are when it is present). The builder only ever copies those two names, refuses to run if `site/` holds anything else, and stops with an error if the result is not exactly those two files, if `index.html` differs from the tracker, or if `index.html` holds an email-shaped string (other than ones ending `.invalid`).

## What the host must give

- Its own hostname: not a folder on a shared site, because everything served from one host can read the book and the AI key that the browser stores for that host.
- https.
- Company sign-in in front of the page.

## What the page loads

For whoever sets the host's network and security rules. This list comes from a search of the 1.1 file for https addresses; it is what the file shows, not a test of a live network.

- `fonts.googleapis.com`: a stylesheet link (Plus Jakarta Sans, JetBrains Mono) and a preconnect to the same host. That stylesheet is Google's; the font files it points to are normally served from `fonts.gstatic.com`, which the tracker file itself does not name, so allow it as well or the fonts fall back.
- `cdnjs.cloudflare.com`: one script, `xlsx/0.18.5/xlsx.full.min.js`, loaded with a plain script tag and **no integrity attribute**, so the host cannot tell if the file it receives is the one intended, and that script runs with full access to the page, the book and the stored AI key.
- The AI provider endpoints, only when someone enters an AI key and uses an AI feature: `api.anthropic.com`, `api.openai.com` and `generativelanguage.googleapis.com`.
- The page needs inline script and inline style: the tracker is one file with both in it. A Content-Security-Policy of `default-src 'self'` stops it from working; it needs at least `'unsafe-inline'` for script and style, plus the hosts above.

## Check a copy from an address before it goes up

`node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve site --seed demo-seed.js --expect 491` serves the `site/` folder from a small local web server (127.0.0.1, GET only, no folder listing) in a throwaway browser profile, opens it by address instead of as a file, and runs the same 488 in-page checks. It refuses to run unless `site/index.html` is the same build as the tracker file, and it prints the address it served and the address the page really had, so a page that was not served by address cannot pass. It also prints a `console errors:` count; for a good build that count is 0 for the file run and the served run.

## Publish a new version

1. Change the tracker file (never the 1.0 file).
2. `node tools/build-site.mjs` rebuilds `site/` and refuses to run if `site/` holds anything else.
3. Run the `--serve site` command above and the same command without `--serve site`; both must print 491/491 and `console errors: 0` (selfcheck exits 1 on any console error).
4. Upload the two files in `site/` only when the owner of the site says yes.

## Keeping the browser's storage

On a served address the tracker asks the browser, once at start-up, to keep its storage (it asks first whether the browser already does, and only asks if not). Chrome and Edge answer on their own, without a prompt; the answer depends on how the browser rates the site. Settings shows one line with the result: `Kept by browser: yes`, `Kept by browser: no (export regularly)`, or, for a copy opened as a file (where no request is made), `Kept by browser: not available when opened as a file`. Export regularly either way.

## A new address starts empty

A hosted address has its own storage, so its tracker starts with no accounts. While the book has no accounts, and only on a served address (never for a copy opened as a file), the tracker shows one line under the tabs: "New address, no book here yet. Export from your old copy, then Import here (Settings)." It disappears as soon as the book has an account, so also after an Import.

## Moving a book to the new address

1. In the old copy: Settings, Export. The Export file carries the accounts, the activities and the call transcripts (transcripts travel inside the Export file).
2. Open the new address. It shows "New address, no book here yet" until the import.
3. In the new copy: Settings, Import, choose the Export file, confirm.
4. AI key: The AI key is not in Export; enter it again after moving.

`node tools/move-book.mjs` rehearses this with the test book only: it exports from a file copy, imports into a served copy in two throwaway browser profiles, and prints `C6 PASS` when the account, activity and transcript counts and a hash over the transcripts are equal on both sides.

## Checking what you received

`index.html` in this package is a byte-for-byte copy of the 1.1 tracker. Its sha256 is `df5b9ba89810140b79b9c75057fe6ee5d19a67216f5fee46ff41acca1661b483`. Compare it with `sha256sum index.html` (or `Get-FileHash index.html` in PowerShell) before uploading. This line is updated in the same commit as any change to the tracker.
