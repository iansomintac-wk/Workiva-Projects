# Workiva Design System

Source of truth: the attached Figma file **"Workiva Brand Guidelines.fig"** (mounted read-only; pages: `Brand-Guidelines-Prototype`, `Development`, `Video-Guidelines`, `Information`, `page`). No codebase or GitHub repo was attached — everything here is derived from that Figma file. No slide-deck PPTX was actually present in `uploads/` despite being referenced; if you'd like brand-presentation slides built from a real deck, attach it and ask again.

Workiva makes connected reporting software (SEC/ESG/GRC/audit reporting). This Figma file is the company's **brand guidelines microsite** — a prototype site (not the product UI) that documents logo usage, color, type, voice & tone, and reusable brand elements (buttons, tables, tags, tiles, icons) used across marketing and sales collateral. There is no separate "app" or "marketing site" source in scope — the guidelines microsite itself is the one fully-specified surface, and is recreated as the UI kit below.

## Index

- `styles.css` — root stylesheet, imports everything below.
- `tokens/` — `fig-tokens.css` (122 raw Figma color variables), `colors.css` (semantic aliases), `typography.css` (font stack + type scale), `spacing.css` (spacing/radius/shadow scale).
- `components/core/` — ~50 reusable UI primitives (buttons, tables, tags, nav, footer, cards, tiles, typography presets) + `fig-assets.css`/`assets/` for their bitmap fills. See full list below.
- `assets/icons/` — unified `Icon` component + `icon-data.js` covering 71 icons (custom illustration glyphs + Material-style UI glyphs + nav/social icons).
- `assets/logo/` — real vector logo components (`WorkivaLogoEn167En`, `WorkivaLogoSteelEn`, `WorkivaEsgLogoEn167En`, `WorkivaAIRLogo`, `WorkivaCarbonLogoLight`).
- `assets/textures/` — noise-grain and paper-texture PNGs used as overlays on brand-color blocks.
- `guidelines/` — foundation specimen cards (colors, type, spacing, voice & tone, texture) shown in the Design System tab.
- `ui_kits/brand-microsite/` — click-through recreation of the Brand Guidelines microsite (Home, Logo, Typography, Colors, Brand Elements, Voice and Tone).
- `SKILL.md` — portable skill definition for use in Claude Code.

## Components (in `components/core/`)

ArrowForward, Assignment, BaseFooterCopyright, BasePaginationArrowSmall, BottomCornerColorsAbsolute, BottomCornerColorsAbsolute2, ButtonPrimaryNew, ButtonPrimaryNew2, ButtonSecondaryNew, CardImageDesc, Check2, Close, ColorCard, ColorExamplesTab, ColorPicker, ColorPickerContainer, Container, ContentCopy, CornerTag, CornerTagAlpha, DocType, DocumentLowFidelity, Download, Footnote, Frame279460, Green, HeadingBodyCopy, IconPlaceholder, IndentationComponent, Mail, NavContainer, NavLinkListing, PaginationArrowSmall, ProcessSelectorContainer, SectionHeading, Star2, SubheadBodyCopy, Table01, TableCell, TableColumnHeader, TableIcon, TileBrandArch, TileBrandElements, TileColors, TileLogos, TileMotion, TileTypography, TileVoiceTone, UnstyledIconButton, WkFooter, WOutlineExpandCollapseTrigger, WOutlineNodeBadges, plus the logo components in `assets/logo/` (`WorkivaLogoEn167En`, `WorkivaLogoSteelEn`, `WorkivaEsgLogoEn167En`, `WorkivaAIRLogo`, `WorkivaCarbonLogoLight`) and the unified `Icon` in `assets/icons/`.

### Intentional additions / omissions
- **Icon architecture**: raw SVG path data for all ~90 icon-shaped families (illustration glyphs like `alarm-clock`/`banking-document`/`piggy-bank`, Material-style glyphs like `check`/`close`/`mail`/`info`, and nav/social glyphs) lives in one place — `assets/icons/icon-data.js` (71 names, see `Icon.d.ts`) — per the "icon set → one data file" pattern, avoiding ~90 copies of SVG path strings. Each family still gets a first-class `components/icons/<Name>.jsx` + `.d.ts` wrapper with its own props contract (`size`, `fill`, `color`, etc.) so it's discoverable and swappable like any other component; the wrapper just renders `<Icon name="…"/>` internally.
- **Third-party logos skipped**: the file also contains customer-logo lockups used in case-study mockups (`braze-logo-16-7-en`, `pwc-logo-16-7-en`, `kpmg-color-logo-16-7-en`, `zurich-insurance-logo-16-7-en`, `playa-hotel&-resorts-logo-16-7-en`). These are other companies' trademarks incidental to sample content, not Workiva brand assets — intentionally not reproduced.
- **One-off housekeeping/decorative nodes skipped**: `ConfigAndData-Bar-Don't remove!` (Figma internal scaffolding), `Global/COMMENT-LINES`, one-off illustrations (`sox_pro_group_white-3`, `workiva-solution-capital-markets-less-risk-more-reward`), and generic `Top`/`Bottom Corner Colors - Absolute` duplicate variants beyond the two already built — these are prototype scaffolding or single-use content graphics, not reusable brand components. (`Indentation Component`/`Factor`, `w_outline/node-badges`, `w_outline/expand-collapse-trigger`, `Container`, `Green` were reconsidered and ARE now built — see Coverage above.)
- **Color-example tab panels** (`color_examples-link_blue`/`presentation`/`purple_mountain`/`zesty_neue`, large usage-illustration frames) were extracted, found to be >4MB image-heavy one-offs with limited reuse value (multi-hundred-KB per component just for background photography), and dropped in favor of the leaner `ColorCard`/`ColorPicker`/`ColorExamplesTab` primitives that carry the same information without the image bloat.
- **`Button Primary-Secondary`** — now built as `ButtonPrimarySecondary`/`BaseButtonPrimarySecondary`, the combined 10-variant Type×State family (in addition to the separately-built `ButtonPrimaryNew`/`ButtonPrimaryNew2`/`ButtonSecondaryNew`, which expose the same primary/secondary matrix as discrete components for simpler call sites).
- **Duplicate-named component sets are one wrapper each, by design**: the source file defines several icons/patterns more than once under identical names but different Figma node ids — e.g. `arrow-k`, `arrow-with-loop` (×4), `check`, `team-of-three`, `spreadsheet-low-fidelity`, `workiva-logo-en-16-7-en`, `UnstyledIconButton`, `.color_examples-base` — because the same glyph/lockup/pattern is instanced in more than one guideline frame. These render identically wherever they appear in the source, so one component/wrapper per **name** is the correct, non-redundant coverage; building a second byte-identical component under an arbitrary suffix would be a meaningless duplicate, not new design content. The Figma-kit-coverage count still treats each node id as a separate "family," which is why the number below can't reach 135/135 without literal duplicate files.

**Coverage:** 113 of 135 figma component families compiled as distinct components. Beyond the primitives above, `components/icons/` holds one thin wrapper component per icon-shaped family (each delegates to the shared `assets/icons/Icon` data set, so the underlying SVG path data stays in one place while every family still gets its own `.jsx`+`.d.ts` and props contract): AlarmClock, ArrowCurved, ArrowK, ArrowM, ArrowQ, ArrowWithLoop, ArrowWithLoopDoubleArrow, Award, BankingDocument, Binoculars, Bolt, Calendar, CallMade, Check, CheckInCircle, Cursor1, DoricColumn, FancyColumn, File, FinanceReport, Fire, FlyingMoney, Gear, GiveSomeLove, Globe, GridOn, Hacker, House, Info, Key, LightBulb, LineChart, MagnifyingGlass, Medal, Megaphone2, Pencil, PiggyBank, PlusSign, PoundCheck, Safe, Simple, Sparkle, SpreadsheetLowFidelity, Sprite, StackOfDollars, StopWatch, Sync, Target, TeamOfThree, ThumbsUp, Wrench. Newer core additions: `Container`, `Green` (decorative color-block set), `DocumentLowFidelity`, `IndentationComponent`, `IndentationFactor` (doc-outline indent guides), `WOutlineExpandCollapseTrigger`, `WOutlineNodeBadges`, `ColorPickerContainer`, `TopCornerColorsAbsolute` (pairs with `BottomCornerColorsAbsolute`), `ButtonPrimarySecondary`/`BaseButtonPrimarySecondary` (the combined 10-variant Type×State button family). See caveats at the end.

## Fonts — ⚠️ substitution flagged

The source file specifies **Adelle Sans** (TypeTogether) exclusively, in Light/Regular/Semibold/Bold/Extrabold/Heavy weights — a commercial font not available for free redistribution, and no font files were included in the Figma export. This system substitutes **Figtree** (Google Fonts), a similarly warm/humanist grotesque with a comparable weight range (300–900). **If you have Adelle Sans license files, share them and this can be swapped for the real face** — it's a visually distinct typeface (the display weight in particular is heavier/rounder than Figtree).

## Content fundamentals (voice & tone)

Source: the file's own "Voice & Tone" section (Section Heading: *The Rules of Voice & Tone*).

- **Four pillars, always in this order:** Relatable, Bold, Clear, Trustworthy.
  - *Relatable* — "Would someone choose to have a beer with us? On purpose?" Write so it's approachable and easy to digest; read your copy aloud and ask if it sounds like something you'd actually say.
  - *Bold* — "Take a stand. Bring a strong perspective." Compete for attention by having an opinion, not by shouting.
  - *Clear* — Respond to a real problem; don't report news, provide a perspective. Ask "why do people care?"
  - *Trustworthy* — Use accurate, industry-fluent language; "use coolness to complement, not compromise, accuracy."
- **"Workiva is / isn't" cheat sheet:** IS Smart, Direct, Approachable, Confident, Trustworthy. ISN'T Pretentious, Abrasive, Needy, Arrogant, Uptight.
- **Tone flexes by context**, not a fixed register: the file's own tone dial runs Informal↔Formal, Playful↔Serious, Quirky↔Professional, Friendly↔Authoritative, Novice↔Expert — e.g. a podcast/blog (educate stage) skews informal/playful; a use-case white paper (value stage) skews formal/professional. Same brand voice, different dial position per format and funnel stage.
- **Reference quote used in the file itself:** David Ogilvy's "write in the language people use in everyday conversation" — plain, spoken, not jargon-y.
- **Person:** second person ("you"), direct address, no corporate "we regret to inform."
- **Casing:** sentence case on headlines and UI labels (not Title Case); short punchy fragments over long compound sentences at display sizes.
- **Emoji:** used sparingly for internal/prototype personality only (one "😎" appears in a placeholder "Coming Soon" tile) — not part of external voice; don't lean on emoji in real content.
- **Vibe:** confident but never stiff; a peer giving you the straight answer, not a vendor pitching you.

## Visual foundations

- **Palette:** warm, high-saturation primaries — Zesty Neue (green, `#66CC66`), Link Blue (`#0074E8`), Presentation yellow/orange (`#FBAD17`), Purple Mountain (`#8C4CBD`) — grounded by Steel (`#333333`, primary ink) and Warm Light (`#FCF4E8`, the signature cream page background — not white). A wide secondary palette (Mr. Toad, Ectoplasm, Morning Dew greens; Poseidon, Robin's Egg, Foggy blues; Cheetah, Cool Ranch, Squashy, Five-Alarm-Chili oranges/reds; Witch Cape, Lavendery, California Raisins purples) is used for data-viz and accent variety, not as everyday UI color. See `guidelines/colors-*.card.html`.
- **Type:** one family (Adelle Sans / Figtree substitute) doing everything from 12px captions to a 178px display headline. Display sizes lean **Heavy (900)** with tight tracking (−0.005em) and ~1.0 line-height — headlines read as bold, blocky, confident. Body copy is Regular 14–16px at 1.4–1.5 line-height. No serif anywhere.
- **Backgrounds:** flat brand-color blocks (not gradients) are the primary background move — big fields of Presentation yellow, Purple Mountain, Zesty Neue behind display type. A subtle **noise/grain texture overlay** (`assets/textures/noise-grain.png`) is blended over these color blocks to add tactility (see the "Voice & Tone" and case-study sections in the source). No photography-driven hero imagery, no stock-photo energy, no busy patterns — this reads as flat-color editorial, not SaaS-gradient.
- **Shapes:** the signature brand shape is a big, soft **rounded-rectangle/pill quote-callout** (99px corner radius) sitting on a color block — used for pull-quotes. Tiles (homepage nav cards) use 40–56px corner radii with a "notch" cut from one corner (an L-shaped rounded silhouette, not a plain rectangle).
- **Corner radii:** buttons 8px; cards/tables 8–16px; homepage tiles 40px (outer shape ~56px); pills/quote-callouts 99px+; pagination/icon buttons circular.
- **Shadows:** minimal — a hairline inset white stroke (`shadow-inset-hairline`, 1px @ 10% white) on dark panels for edge definition, plus a soft two-layer drop shadow on white cards (`shadow-card`). No heavy elevation, no colored glows.
- **Buttons:** primary = filled Link Blue pill/rounded-rect with white text, or an outline (2px inset Link Blue stroke) ghost variant; hover swaps fill↔outline; text stays Adelle Sans Medium 16px. Secondary buttons are plain-text-with-underline-on-hover style, no fill.
- **Hover/press states:** subtle — primary button hover lightens/inverts fill rather than darkening; nav links get a faint white-overlay background (~6% white) plus an accent-color text swap on the active item; no scale/shrink press effect observed in the source.
- **Borders:** thin (1px) neutral-gray hairlines (Ethereal `#D8D8D8`) for card/table dividers; no colored borders, no left-accent-bar cards.
- **Transparency/blur:** used sparingly — faint white overlays for hover states and the grain-texture blend; no glassmorphism/backdrop-blur anywhere in the source.
- **Imagery color vibe:** the file has almost no photography — content is flat vector illustration (icons) and UI screenshots framed in bezels. Where reference imagery exists it's warm-toned, not desaturated/blue-cool, matching the cream/warm palette.
- **Layout:** left-hand fixed 248px dark-steel sidebar nav (persistent across the guidelines site) + fluid content column; full-bleed color-block section breaks; generous 100px page gutters at desktop width; content max-width ~980px within full-bleed sections.
- **Animation:** none observed in the static Figma file (no prototype transitions captured) — treat as a static-first brand; use ordinary fades for any UI you build on top, nothing bouncy.

## Iconography

Two distinct icon vocabularies appear in the source, both extracted verbatim (not redrawn):
1. **Custom Workiva illustration icons** (~55 glyphs) — line-and-shape brand icons like `alarm-clock`, `banking-document`, `binoculars`, `flying-money`, `piggy-bank`, `stack-of-dollars`, `team-of-three`, `light-bulb`, `target`, `key`, `safe`, decorative shapes (`doric-column`, `fancy-column`, `sparkle`), and "low-fidelity" document/spreadsheet stand-ins. These carry the brand's warmth into otherwise text-heavy sections.
2. **Material-Symbols-style UI glyphs** (`check`, `close`, `download`, `mail`, `info`, `content_copy`, `grid_on`, `call_made`, `assignment`, `arrow_forward` — real Google Material Symbols names) used for interface chrome, plus nav-rail and social glyphs (`icon-nav-*`, `icon-instagram`, `icon-linkedin`, `icon-youtube`).

Both are shipped from one place — `assets/icons/Icon.jsx` + `icon-data.js` — render with `<Icon name="…" size={24} />`; single-color, paints via `currentColor`. No icon font is used; everything is inline SVG path data. No emoji-as-icon usage found (one literal 😎 emoji appears once, in placeholder copy, not as an icon). No unicode-glyph icons.

## Caveats

- **PPTX not found**: the brand-presentation toolkit referenced in the original ask was not actually present in `uploads/` — nothing was extracted from it. Attach it if you'd like slide templates built from it.
- **No app/product UI in scope**: this Figma file is brand guidelines only — there's no dashboard, editor, or mobile app to recreate. The one UI kit here recreates the guidelines microsite itself.
- **Font substitution**: Adelle Sans → Figtree (see Fonts section above). Please share real font files if you have a license.
- **~22 component families remain intentionally unbuilt** — 5 third-party customer logos (Braze, PwC, KPMG, Zurich Insurance, Playa Hotels & Resorts), 4 image-heavy color-example tab panels, a housekeeping node (`Global/COMMENT-LINES`), 1–2 one-off illustrations (`sox_pro_group_white-3`, `workiva-solution-capital-markets-less-risk-more-reward`), and duplicate-named node ids for icons/patterns already covered by an existing wrapper. All are named and reasoned about in "Intentional additions/omissions" above. Ask if you want any specific one broken out anyway.
- Several nested-instance style overrides in the source (deep component swaps, per-character text style runs) don't fully round-trip through Figma's variable/instance model — verbatim numeric values (spacing, radii, type scale, colors) were preserved; a few compound components may need a manual pass against `fig_screenshot` if you spot drift.

**Please review and iterate with me** — flag any color, spacing, or copy value that looks off against the live Figma file, tell me which of the 80 remaining icon/one-off families you actually want as first-class components, and send Adelle Sans license files if you have them so I can swap in the real typeface.
