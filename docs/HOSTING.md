# Hosting the OSM Runway tracker

This page is written so it can go to whoever runs the host, unchanged. Nothing in this repository publishes anything.

## What this is

The tracker is one HTML file. It runs in the browser. The book (accounts, activities, call transcripts) lives in this browser's own storage for the address the page is opened from: a copy opened as a file and a copy opened from a web address each have their own, separate, empty-to-start book. The tracker does not send the book to a server. The AI features are the exception: when someone enters an AI key in Settings and uses an AI feature, the text they ask about is sent to the AI provider they configured (Anthropic, OpenAI or Gemini), and nowhere else. Everything else works with no network.

## What to upload

Exactly two files, made by `node tools/build-site.mjs` into the `site/` folder: `site/index.html` (a byte-for-byte copy of the 1.1 tracker) and `site/.nojekyll` (an empty file; GitHub Pages serves files as they are when it is present). The builder only ever copies those two names, refuses to run if `site/` holds anything else, and stops with an error if the result is not exactly those two files, if `index.html` differs from the tracker, or if `index.html` holds an email-shaped string (other than ones ending `.invalid`).

## What the host must give

- Its own hostname: not a folder on a shared site, because everything served from one host can read the book and the AI key that the browser stores for that host.
- https.
- Company sign-in in front of the page.

## Check a copy from an address before it goes up

`node tools/selfcheck.mjs osm-book-of-business-tracker-1.1.html --serve site --seed demo-seed.js --expect 475` serves the `site/` folder from a small local web server (127.0.0.1, GET only, no folder listing) in a throwaway browser profile, opens it by address instead of as a file, and runs the same 475 in-page checks. It refuses to run unless `site/index.html` is the same build as the tracker file, and it prints the address it served and the address the page really had, so a page that was not served by address cannot pass. It also prints a `console errors:` count; for a good build that count is 0 for the file run and the served run.

## Publish a new version

1. Change the tracker file (never the 1.0 file).
2. `node tools/build-site.mjs` rebuilds `site/` and refuses to run if `site/` holds anything else.
3. Run the `--serve site` command above and the same command without `--serve site`; both must print 475/475 and the same `console errors:` count.
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
