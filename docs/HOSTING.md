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
