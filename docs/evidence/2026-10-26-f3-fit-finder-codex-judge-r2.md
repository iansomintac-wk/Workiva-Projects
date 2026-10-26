# F3 (Fit Finder half): fresh Codex judge, round 2, 2026-10-26

Command (from Ian's PC, codex-cli 0.163.0, branch harness/f3-data-real-guard at 3c059b4, run 2026-10-26T05:35:54Z to 2026-10-26T05:44:03Z, 30 min timeout; the prompt is echoed at the top of the output):

```
timeout 1800 codex exec --sandbox read-only --ephemeral -C "C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard" "$(cat r2prompt.txt)" < /dev/null
```

Result: **Verdict: FAIL**. Both round-1 must-fixes are judged fixed: the five GIT_* overrides are dropped (any case), and `ls-files -z` plus the case-insensitive regex catches `data/REAL/...`. Two new must-fixes: (1) an accidental `git init` inside `fit-finder/` makes `git -C fit-finder` read the new empty index, so files tracked in the outer repo pass; (2) the selftest's own setup git commands (`init`, `add`, `rm --cached`, `hash-object`, `update-index`) still inherit GIT_* overrides and do not check their exit codes, so with an inherited override they can touch the wrong repo or index. The gate join, fail-closed paths and non-vacuous checks were judged sound. The selftest could not run in the read-only sandbox (mkdtemp EPERM). Output scanned before saving: every `data/real` path in it is a fixture or synthetic name.

## Full output

````
Reading additional input from stdin...
OpenAI Codex v0.163.0
--------
workdir: C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
model: gpt-6.1-sol
provider: openai
approval: on-request
sandbox: read-only
reasoning effort: high
reasoning summaries: none
session id: 01a176b5-55ef-7ec1-aef6-29968a520750
--------
user
You are a fresh, independent judge. Review branch harness/f3-data-real-guard (commit 3c059b4) of this repo. Read-only: do not edit files.

HARD RULE: never open, list, cat, grep or git-show anything under fit-finder/data/ or any data/real path (real customer data and labels). Read only: fit-finder/tools/gate-check.js, fit-finder/tools/data-real-guard.js, fit-finder/tools/data-real-guard-selftest.js, fit-finder/tools/gate-selftest.js, fit-finder/tools/README.md, docs/evidence/2026-10-26-f3-data-real-guard.md, docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md (the previous judge's output), and git metadata (git log, git diff prompt-coach...HEAD -- fit-finder/tools docs/evidence, git show 3c059b4). The sandbox is read-only, so the selftests may not run (they write to the temp dir); if so, judge from the code and the recorded output in the evidence file, and say so.

Requirement (studio-harness F3): the Fit Finder done check (fit-finder/tools/gate-check.js) must fail whenever git tracks anything under data/real (that is, anything under fit-finder/data/real is in the git index), including failing when git itself errors. It must be proved by a test written first that uses a throwaway repo as the fixture, never the real data.

Context: a previous judge failed commit d007e0b on two must-fixes: (1) inherited GIT_INDEX_FILE / GIT_WORK_TREE (and similar env vars) made git ls-files print nothing and exit 0; (2) the data/real pathspec was case-sensitive, so data/REAL/... passed on Windows. Commit 3c059b4 claims to fix both. Do not take that claim on trust.

Answer:
1. Are both previous must-fixes really fixed? Does gate-check.js now fail whenever git tracks anything under fit-finder/data/real, in every mode (--no-git, --stage before, --stage final, any outcome)? Does it fail when git errors (not a repo, git missing, other failure)?
2. Does data-real-guard-selftest.js prove it with a throwaway repo, testing the real gate-check join and not only the helper? Is any check vacuous (true by construction)? Do the new env-var and case checks actually exercise the fixed code paths?
3. Try your own bypasses and name each one with its result: for example the cwd it runs from, paths with spaces, newlines or unusual names, files staged but not committed, files in subfolders, case differences on Windows, a data/real symlink, nested repos or submodules, GIT_DIR/GIT_WORK_TREE/GIT_INDEX_FILE/GIT_CEILING_DIRECTORIES or other GIT_* env vars or git config (including GIT_CONFIG_* env vars) that change what ls-files lists, sparse checkout or skip-worktree, a data/real path elsewhere in the repo, early exits in gate-check before the guard runs, the order of checks, and anything the new code broke (false failures on paths that merely contain "real", output size limits).

Must-fix rule: a must-fix is anything that ordinary use or an honest mistake gets past. A deliberate trick counts as a must-fix only if the fix is small. List must-fixes first, then minor notes.

End your reply with exactly one final line: "Verdict: PASS" (no must-fix) or "Verdict: FAIL" (one or more must-fixes).
warning: loading hooks from both C:\Users\teasp\.codex\hooks.json and C:\Users\teasp\.codex\config.toml; prefer a single representation for this layer
2026-10-26T05:36:02.452325Z ERROR codex_rmcp_client::oauth::refresh_transaction: error=failed to refresh OAuth tokens for server openart: OAuth refresh token was rejected: Server returned error response: invalid_grant: The refresh token is invalid, expired, or revoked.
hook: SessionStart
hook: SessionStart
hook: SessionStart
hook: SessionStart Completed
hook: SessionStart Completed
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
I’ll review the two fixes and the gate’s control flow, then try bypasses within the read-only limits. I expect about 15 minutes; I’ll keep all customer-data paths untouched.
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node "C:/Users/teasp/Documents/studio-harness/plugin/scripts/live_copy.mjs"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 606ms:
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"LIVE COPY NOT UPDATED: fetch failed; 0 behind origin/main; this session runs old harness rules; say this in your first line to the user"}}
hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node "C:/Users/teasp/Documents/studio-harness/plugin/scripts/goal_start.mjs"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 608ms:
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"NO GOAL.md in C:\\Users\\teasp\\Documents\\workiva\\.claude\\worktrees\\f3-data-real-guard: a hand-off from here will be refused by town-launch until Ian approves one."}}
hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node "C:/Users/teasp/Documents/studio-harness/bin/brain.mjs" context' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 1411ms:
CHECKS
Run node --test --test-name-pattern='git.exe|gh.exe' test/slip_guard.test.mjs; in a run with no slip, git.exe push, GIT.EXE push, a full path to git (forward or back slashes) and a full path to gh.exe pr merge must each exit 2. [2026-10-13-slip-guard-misses-git-exe]
Run node --test --test-name-pattern='attached -C' test/slip_guard.test.mjs; from a work-branch repo, git -C<main repo> merge and git -C\"<main repo>\" merge must exit 2 while the same merge without -C exits 0. [2026-10-13-slip-guard-attached-c-merge]
Run node --test --test-name-pattern='detail prefers the spawn error code' test/evalrun.test.mjs; a run whose spawn fails must name the error code in its detail, never UNKNOWN. [2026-09-06-spawn-failure-detail-carries-no-error-message]
ASK
node "C:\Users\teasp\Documents\studio-harness\bin\brain.mjs" query <words> | show <page-id> | gate "<task>" | why <page>

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'C:/Users/teasp/.codex/plugins/cache/superpowers-marketplace/superpowers/7.0.1/skills/using-superpowers/SKILL.md','C:/Users/teasp/.agents/skills/task-observer/SKILL.md','C:/Users/teasp/.codex/plugins/cache/superpowers-marketplace/superpowers/7.0.1/skills/verification-before-completion/SKILL.md' " in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 1184ms:
---
name: using-superpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## The Rule

**Invoke relevant or requested skills BEFORE any response or action** �?" including clarifying questions, exploring the codebase, or checking files. If it turns out wrong for the situation, you don't have to use it.

**Before entering plan mode:** if you haven't already brainstormed, invoke the brainstorming skill first.

Then announce "Using [skill] to [purpose]" and follow the skill exactly. If it has a checklist, create a todo per item.

## Skill Priority

When multiple skills apply, process skills come first �?" they set the approach, then implementation skills (frontend-design, etc.) carry it out. Brainstorming and systematic-debugging are Superpowers' most common process skills, but the rule holds for any of them.

- "Let's build X" �+' superpowers:brainstorming first, then implementation skills.
- "Fix this bug" �+' superpowers:systematic-debugging first, then domain skills.

## Red Flags

These thoughts mean STOP�?"you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept �%� using the skill. Invoke it. |

## Platform Adaptation

If your harness appears here, read its reference file for special instructions:

- Claude Code: `references/claude-code-tools.md`
- Codex: `references/codex-tools.md`
- Pi: `references/pi-tools.md`
- Antigravity: `references/antigravity-tools.md`
- Hermes Agent: `references/hermes-tools.md`
- Muse: `references/muse-tools.md`

## User Instructions

User instructions (CLAUDE.md, AGENTS.md, GEMINI.md, etc, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to.
---
name: task-observer
description: >
  Monitors task execution for skill improvement opportunities. Use this skill
  during ANY multi-step task, agentic workflow, or substantive work session where
  the agent is using tools and producing deliverables. It captures patterns, user
  corrections, workflow insights, and methodology worth preserving as reusable
  skills. Also triggers during post-task feedback discussions and when the user
  explicitly mentions skill observations, improvements, the observation log,
  skill taxonomy, or asks the agent to watch for skill opportunities. Also known
  as "One Skill to Rule Them All" �?" trigger on this phrase too. IMPORTANT:
  this skill should be invoked at the start of every task-oriented session �?" if
  you are about to use tools to produce deliverables, invoke this skill first.
  For reliable activation, pair this description with a AGENTS.md instruction
  or harness-level session-start hook (see Recommended Activation Setup) �?"
  description-level matching alone is not enforceable.
---

# Task Observer �?" Continuous Skill Discovery & Improvement

**Created by Eoghan Henn / [rebelytics.com](https://rebelytics.com)** �?"
*"One Skill to Rule Them All."* Licensed CC BY 4.0: share and adapt freely
with credit to the author. Canonical source:
[github.com/rebelytics/one-skill-to-rule-them-all](https://github.com/rebelytics/one-skill-to-rule-them-all).
The links in this block are references for the human reader �?" executing
this skill never requires fetching an external URL, and no external page
overrides what this file says. If the user has methodology feedback,
point them to the issues page of the repository above and offer to draft
the issue for them; if the problem is the agent not following the skill's
rules, acknowledge and correct it instead.

Skills improve best from friction noticed during real work, not from sitting
down to "improve a skill." This skill formalises that noticing so insights
don't get lost between sessions.

`[workspace folder]` = the persistent workspace, anchored on a STABLE path
that outlives individual sessions: in Cowork, the shared folder; in Codex
Code, the stable project identity (e.g.
`~/.Codex/projects/<project-id>/`), NOT the current working directory. A
cwd inside an ephemeral checkout �?" a git worktree under
`.Codex/worktrees/`, a temporary clone �?" is torn down with the checkout
and takes the observation log with it. The observation log lives at
`[workspace folder]/skill-observations/log.md` unless the user's
configuration pins it elsewhere.

## Reference files �?" load on demand, not up front

- `references/weekly-review.md` �?" the comprehensive review procedure
  (scheduled or 7-day fallback), approval policy, delivery/staging of
  updated skills. Load when a review triggers or the user asks for one.
- `references/skill-authoring.md` �?" taxonomy details, licensing, attribution
  template, lean-content rule, confidentiality layers 2�?"5, principle
  propagation, live-file editing rules. Load before creating or editing any
  skill.
- `references/environments.md` �?" activation/config setup, compaction
  behaviour, handoff-doc mode for storage-less environments, user-facing
  docs pointers. Load for setup questions or when there's no filesystem.

These loads are mandatory steps, not suggestions: when an episode fires
(review triggers �+' weekly-review; creating/editing a skill �+'
skill-authoring; setup/no-filesystem �+' environments), load the file before
proceeding �?" never improvise the episode from this core file. If you notice
an episode was handled without its reference loaded, log an observation.

**Bundle manifest:** this skill consists of `SKILL.md` plus the three
reference files listed above. If a referenced file is missing, the install
is incomplete: proceed using the rules in this file, tell the user which
files are missing, and point them to the full bundle at the canonical
source (for the published version, the repository in the attribution
above).

## Session Start Protocol

1. If `skill-observations/log.md` or `cross-cutting-principles.md` don't
   exist, create them (templates below / in the principles section of
   `references/skill-authoring.md`). Also create
   `skill-observations/last-review-date.txt` containing the literal value
   `never` if it doesn't exist �?" never write a date into it at setup; a
   date means a review actually ran. Before creating or writing anything:
   if the resolved workspace folder sits under an ephemeral path (e.g.
   `.Codex/worktrees/`, a temporary clone), warn the user and re-anchor
   on the stable project path first �?" state written to an ephemeral
   checkout is lost at teardown.
2. Scan OPEN observations and active principles; hold them in awareness,
   don't surface unprompted.
3. Read `skill-observations/last-review-date.txt`. The value carries the
   truth: a date = when the last review actually ran; `never` = no review
   has run yet. A missing file is abnormal (step 1 creates it) �?" recreate
   it with `never`, don't invent a date. If the value is `never` or older
   than 7 days AND there are OPEN observations: in an interactive session,
   offer the review in one line ("the observation backlog hasn't been
   reviewed [in N days / yet] �?" run it now, or carry on with your task?")
   and proceed with the user's task unless they opt in; never gate their
   work on the review. Only a scheduled/autonomous run loads
   `references/weekly-review.md` and runs the review unprompted.
4. Once per session: if no AGENTS.md (or equivalent) activation instruction
   for this skill exists, briefly suggest adding one (see
   `references/environments.md`). Skip if already configured.
5. Note the log's modification time. If modified in the last few hours,
   another session may be writing to it �?" re-read immediately before every
   append, never trust a remembered "current number".

## When to Observe

Active for the entire task session: execution, post-task feedback and
review discussion, meta-discussion about skills or methodology, and
reflective/strategy conversations about how work should be done. **The
observation mindset does not deactivate when the conversation shifts from
doing the work to discussing it** �?" user feedback in review phases is often
the highest-signal input. Inactive only for casual conversation and quick
factual questions with no tools or deliverables involved.

## What to Watch For

**Signals for a NEW skill:** a reusable multi-step workflow; a methodology
the user explains that no existing skill captures; a recurring task type
with similar structure; a process with clear inputs, phases, outputs; the
user describing a refined process ("I always do it this way"); a structured
approach emerging naturally during work.

**Signals for IMPROVING an existing skill:** anything from a task that used
a skill and could make it better �?" problems, positive signals, or neutral
gaps. Examples: the agent violates a documented rule (the skill needs
enforcement, not louder rules); a user correction reveals a missing rule or
edge case; a better workflow emerges than the skill recommends; a technique
works well enough to promote from incidental to recommended; an undocumented
use case; feedback that generalises; a wrong assumption; new tooling
obsoletes a step; corrections forming a pattern; a principle that applies to
other skills too; a naming/framing/structural suggestion, even
conversational.

**Signals for SIMPLIFYING a skill:** a section never relevant across many
sessions; a rule from a single unvalidated observation; workflows users
consistently shortcut; sections loaded but never acted on; contradictory
rules; "just in case" complexity that never triggered; a rule the agent
consistently fails to follow (convert to structural enforcement �?" checklist,
verification step, unskippable tool call �?" or remove it). Treat these as a
review checklist; ask "what can we remove?" as deliberately as "what should
we add?"

**Do NOT log:** one-off corrections that don't generalise; preferences
already captured in a skill; tool bugs unrelated to methodology;
observations that would need proprietary client information to be useful in
an open-source skill (unless an internal skill is the right home).

## How to Log

Append to the log **silently, within the same turn or the next** �?" never
batch mentally for later; the act of writing is the enforcement mechanism.

**Mandatory observation checkpoint after every 3rd TodoWrite completion:** After
marking the 3rd, 6th, 9th (etc.) TodoWrite item as completed in a session, you
must **write to the log** �?" not merely pause to ask yourself a question. Either
append any pending observations, or, if genuinely none have accumulated, append
an explicit acknowledgement marker (a one-line `no observations` note for that
checkpoint). The required action is a concrete log write; a remembered "ask
whether" is not enforcement. This is a hard checkpoint, not a suggestion �?" the
skill has demonstrated that softer "check when completing items" or "pause and
ask" guidance gets lost during cognitively demanding analytical work, exactly
when the most observations accumulate. The count doesn't need to be precise;
the rule is: roughly every third completion, write to the log (observations or
the acknowledgement marker). The write itself is the enforcement mechanism: it
forces the mental check to surface as a recorded action, and it prevents the
common failure mode where the skill is loaded but no observations are written
until the user explicitly asks.

**Deliverable-event flush:** Hard enforcement that hooks onto tool calls you are
already making is the only reliable mechanism; soft prompts that rely on memory
don't survive cognitive load during long substantive sessions (when the most
insights surface). So tie observation-flushing to deliverable and workflow events
that already involve a tool call. Whenever you present or render a major
deliverable �?" `present_files`, a deck or PDF render, a staged skill file handed
to the user �?" or complete a task/todo batch, flush any pending observations to
the log at that moment, before moving on. These are natural, already-occurring
checkpoints; piggy-backing the flush onto them means the write happens as a
side effect of work you were doing anyway, rather than depending on a separate
act of memory.

**Numbering discipline (mandatory, every append):**

1. *Pre-check:* read the actual log and find the highest existing number �?"
   never trust session memory:

   ```bash
   # GNU grep:
   grep -oP '### Observation \K\d+' log.md | sort -n | tail -1
   # macOS / POSIX:
   grep -o '### Observation [0-9]*' log.md | grep -o '[0-9]*' | sort -n | tail -1
   ```

2. *Pre-write assertion:* immediately before appending, confirm the proposed
   number doesn't already exist:

   ```bash
   PROPOSED=$(( $(grep -oP '### Observation \K\d+' log.md | sort -n | tail -1) + 1 ))
   grep -qE "^### Observation ${PROPOSED}:" log.md && {
     echo "COLLISION on #${PROPOSED}"; exit 1; }
   ```

   If it fires, increment past all existing numbers and re-check (and log a
   meta-observation �?" it signals a parallel-session collision).

3. *Post-write verification:* after appending, count occurrences of the
   number; if >1, a parallel writer collided between check and write �?"
   renumber YOUR entry to max+1. Identify your entry from your own append
   operation (capture the file's line count immediately before and after
   your `>>`; your entry starts at the old line count + 1) �?" do NOT
   re-grep and take the last occurrence, which may be a colliding writer's
   entry appended after yours. After any `sed` renumber, re-read the
   affected line to confirm the substitution actually took effect �?" a
   line-addressed `s///` whose target shifted finds no match and still
   exits 0. Pre-write catches stale reads; only a post-write check catches
   the race. The pattern for shared logs written by parallel agents is
   check-then-act-then-verify.

**Log-write safety �?" never let a mutation span entry boundaries:** When
mutating the log programmatically (marking entries ACTIONED/DECLINED,
archiving, renumbering), a greedy or DOTALL pattern over the whole file can
silently swallow everything from one match to EOF. This has happened: a
`.*$` under `re.S` over the multi-entry file captured from one entry's
Status line to end-of-file and overwrote 16 later entries in a single
substitution. The log is shared state across many entries; mutate it one
bounded entry at a time and verify every mutation.

1. **Re-read and merge immediately before any write-back.** Any full-file
   rewrite (archival, renumbering, reassembly from chunks) built from a
   snapshot destroys whatever concurrent sessions appended after that
   snapshot �?" the write-back succeeds, the victim gets no error, and the
   loss is invisible. This has happened in production: a parallel session's
   write-back erased two entries appended minutes earlier, hours after the
   exact failure mode had been documented. So: take the snapshot, prepare
   the mutation, then �?" immediately before writing �?" re-read the live log
   and diff against the snapshot. If new entries appeared, merge them into
   the write-back (or rebuild from the fresh read). Never write back a
   stale snapshot.

2. **Isolate the target entry, or anchor to a single line.** Either split
   the log on `### Observation N:` headers, edit the TARGET entry's chunk in
   isolation, and reassemble �?" OR, for a status-only edit, use a strictly
   line-anchored multiline substitution that cannot cross a newline, e.g.
   `re.sub(r'(?m)^(\s*-?\s*)\*\*Status:\*\*.*$', ...)` (multiline `^...$`
   bounds the match to one line). NEVER use a DOTALL/greedy pattern across
   the multi-entry file.

3. **Assert a structural invariant against the LIVE pre-write file.** Count
   `### Observation` headers in the live file immediately before writing and
   again after. For a status-only edit the count MUST be unchanged; for
   archival or append it must change by exactly the expected number. The
   baseline must be the live file at write time, NOT your session's earlier
   snapshot �?" an invariant computed against a stale snapshot validates that
   you wrote what you intended while still destroying what others wrote in
   between. Fail loudly if the count is off.

4. **Keep the pre-write backup.** Copy `log.md` before any programmatic
   mutation. This is what made full recovery trivial when the truncation
   above occurred �?" it turned a destructive bug into a non-event.

5. **Verify your entries SURVIVED, not just that they were written.** A
   successful append proves nothing an hour later �?" a concurrent session's
   write-back can silently delete it, and only the destroying session gets
   any signal (none). Before surfacing observations at session end, grep
   the log for every entry number this session wrote and confirm each still
   exists exactly once; re-append any that are missing (with fresh numbers)
   and log a meta-observation about the collision.

Principle: a log shared across many entries must be mutated one bounded
entry at a time; every rewrite must be based on a fresh read, verified by a
structural invariant against the live pre-write file, and backed up. Writers
must verify survival, not just successful writes �?" in a concurrent erase,
the victim gets no error.

**Format and insertion:** always `### Observation NNN:`, always appended to
the END of the log, never mid-file, never alternative ID formats. One
format, one insertion point. **Every new observation MUST include
`**Status:** OPEN` as its first field �?" this is mandatory at write time, not
optional.** Reviews classify entries by their Status line; an observation
written without one is invisible to any status-filtered pass and risks being
silently skipped instead of triaged.

```markdown
### Observation [N]: [Short descriptive title]

**Status:** OPEN
**Date:** [date]
**Session context:** [what task was being worked on]
**Skill:** [existing skill name, or "New skill candidate: [working name]"]
**Type:** [open-source | internal]
**Phase/Area:** [which part of the skill or workflow]

**Issue:** [What happened �?" specific enough to understand weeks later
without the original conversation.]

**Suggested improvement:** [Concrete change. For existing skills, name the
section or rule; for new skills, scope and key components.]

**Principle:** [The generalisable takeaway �?" the most important field.]
```

**Context preservation:** if an observation depends on session-local data
(uploads, API output), save that context into the workspace first and add a
`**Reference file:**` line �?" an observation whose evidence dies with the
session is incomplete.

**Confidentiality at logging time:** for `type: open-source` observations,
the Issue/Improvement fields may reference specifics for context, but the
Principle must be fully generalised �?" no client names, domains, or details
traceable to a real project. Full confidentiality layers for skill
authoring: `references/skill-authoring.md`.

## Referencing Observations

When citing an observation by number �?" in conversation, in a review report,
or from within another observation �?" the number must come from the entry's
literal `### Observation N:` header line. Never cite an observation number
that wasn't read from that header.

- **Search-tool line numbers are positional metadata, not IDs.** `grep -n`
  prefixes every match with a line number; when a match lands mid-entry
  (e.g., on a Session context or Principle line rather than the header),
  that line number is NOT the observation number. Resolve to the owning
  header first �?" scan backwards from the matched line to the nearest
  preceding `### Observation N:` header and take the number from there
  (e.g., an awk backwards-scan, or re-grep for `^### Observation` and pick
  the last header line before the match).
- **Plausibility check (cheap second layer):** before quoting any
  observation number, compare it against the known counter range �?" the
  highest `### Observation N:` header in the log. A number outside that
  range (e.g., citing #1365 when the log's counter is at #766) is almost
  certainly a line number or other positional artefact misread as an ID.

The general rule: IDs must come from the record's own identifier field,
never from the positional metadata of the search tool that found it.

## Taxonomy (quick version)

**Open-source** �?" client-agnostic, methodology-driven, useful to other
practitioners. **Internal** �?" contains user/client/project specifics or
personal preferences. Default to open-source when it could go either way,
stripping specifics. The boundary is also a confidentiality boundary. Full
requirements (attribution, licensing, structure): `references/skill-authoring.md`.

## Archival on Write

On every log write, first move already-resolved entries to
`skill-observations/archive/log-[YYYY-MM-DD].md` (preserving the log header
in the archive). "Already resolved" is decided by date, read from the file:
a resolved status MUST record its date �?" `ACTIONED (YYYY-MM-DD) �?" [what was
done]` / `DECLINED (YYYY-MM-DD) �?" [reason]` �?" and archival moves only
entries whose recorded date is before today. Entries resolved today stay in
the active log until the next day, no matter which session resolved them:
the grace period lives in the file, never in session memory, so it holds
across parallel and subsequent sessions. A resolved entry with no readable
date gets today's date added instead of being archived. The active log
keeps its header, status key, all OPEN entries, and the same-day-resolved
ones.

Archival is a read-filter-rewrite �?" the highest-risk mutation the log
undergoes, and the one that has destroyed concurrent appends in production.
It MUST follow the full Log-write safety sequence above: backup, re-read
the live log immediately before writing back and merge any entries that
appeared since the snapshot, then verify the post-write header count equals
the live pre-write count minus exactly the number of archived entries.

## Log Structure

```markdown
# Skill Observation Log

Observations captured during task-oriented work.

**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill
updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue �?"
resolved statuses always carry their resolution date

---

## [Date]

### Observation 1: [Title]
**Status:** OPEN
[... full format ...]
```

## Surfacing Protocol

Default: at end of session, as a grouped summary �?" improvements grouped by
skill, new-skill candidates listed separately; for each, one sentence plus
suggested type; ask which to act on. Surface earlier when an observation
needs user input to be complete, when a skill is actively producing wrong
output, or when observations cluster on one skill.

**Default to log-and-defer.** Surfacing an observation is not an invitation
to act on it. The default is log-and-defer: state that the observation is
logged for the next review, and stop. Reserve in-session application
strictly for the two triggers already defined under "Acting on
Observations" �?" an explicit user request that names the action, or
correcting a skill that is producing wrong output in the current session.

Do NOT routinely offer a binary "apply now vs leave for next review" choice
when surfacing observations. For users who run regular reviews, that offer is
unwanted friction repeated every session. If a user has expressed a standing
preference to always defer to the next review, suppress the in-session
"act now?" offer entirely rather than asking each time.

**Self-check before surfacing:** observations were logged throughout the
whole session (including discussion phases); logged silently; each follows
Issue �+' Improvement �+' Principle; each is typed; existing-skill items name
the section; no open-source Principle contains client-identifying info;
every appended observation carries a Status line (`**Status:** OPEN` at
write time) �?" a statusless entry is invisible to any status-filtered review
pass, so if any observation lacks one, add it now. Finally, run the
survival check (Log-write safety rule 5): grep the log for every entry
number this session wrote and confirm each still exists exactly once �?" a
concurrent session's write-back deletes silently. Fix failures before
surfacing.

## Acting on Observations

Act only in three contexts: (1) the comprehensive review (load
`references/weekly-review.md`); (2) an explicit user request ("update X
skill", "act on observation #N"); (3) in-session correction when a skill is
producing wrong output the user should know about. Otherwise: log, don't
act.

When acting: small, clearly-additive, low-risk changes (a new rule, a
clarification, a factual fix) may be applied directly. Substantial changes
(restructuring, new capabilities, changed methodology) and all new-skill
creation: load `references/skill-authoring.md` first and follow its editing
and staging rules. If an observation reveals a principle that applies to
skills generally, propose it for the cross-cutting principles file (see the
same reference).

## Quick Reference

| Question | Answer |
|----------|--------|
| When do I observe? | The whole session, including feedback and reflection phases |
| How do I log? | Silently, immediately, appended to the end, with the 3-step numbering discipline |
| When do I surface? | End of session, or earlier if needed |
| Status line? | Mandatory `**Status:** OPEN` as the first field of every new observation; reviews treat statusless entries as OPEN, never as nonexistent |
| Citing an observation number? | Only from its literal `### Observation N:` header �?" `grep -n` line numbers are positional metadata, not IDs; sanity-check against the known counter range |
| Open-source or internal? | Default open-source; the boundary is confidential |
| Small fix or substantial? | Additive �+' apply directly; restructuring/new skill �+' `references/skill-authoring.md` |
| Rewriting the log (archival/renumber/status)? | Backup �+' re-read live and merge �+' bounded mutation �+' verify count against live pre-write file �+' confirm own entries survived |
| Weekly review? | Trigger check at session start; procedure in `references/weekly-review.md` |
| No filesystem? | Handoff-doc mode �?" `references/environments.md` |
---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

## Overview

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

## Red Flags - STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!", etc.)
- About to commit/push/PR without verification
- Trusting agent success reports
- Relying on partial verification
- Thinking "just this once"
- Tired and wanting work over
- **ANY wording implying success without having run verification**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence �%� evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter �%� compiler |
| "Agent said success" | Verify independently |
| "I'm tired" | Exhaustion �%� excuse |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Key Patterns

**Tests:**
```
�o. [Run test command] [See: 34/34 pass] "All tests pass"
�?O "Should pass now" / "Looks correct"
```

**Regression tests (TDD Red-Green):**
```
�o. Write �+' Run (pass) �+' Revert fix �+' Run (MUST FAIL) �+' Restore �+' Run (pass)
�?O "I've written a regression test" (without red-green verification)
```

**Build:**
```
�o. [Run build] [See: exit 0] "Build passes"
�?O "Linter passed" (linter doesn't check compilation)
```

**Requirements:**
```
�o. Re-read plan �+' Create checklist �+' Verify each �+' Report gaps or completion
�?O "Tests pass, phase complete"
```

**Agent delegation:**
```
�o. Agent reports success �+' Check VCS diff �+' Verify changes �+' Report actual state
�?O Trust agent report
```

## When To Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction
- ANY positive statement about work state
- Committing, PR creation, task completion
- Moving to next task
- Delegating to agents

**Rule applies to:**
- Exact phrases
- Paraphrases and synonyms
- Implications of success
- ANY communication suggesting completion/correctness

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'fit-finder/tools/gate-selftest.js','fit-finder/tools/README.md','docs/evidence/2026-10-26-f3-data-real-guard.md','docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md'" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'fit-finder/tools/data-real-guard.js','fit-finder/tools/data-real-guard-selftest.js','fit-finder/tools/gate-check.js'" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git status --short --branch --untracked-files=no; git log -6 --oneline; git diff prompt-coach...HEAD -- fit-finder/tools docs/evidence; git show --format=fuller --no-patch 3c059b4' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 1075ms:
/* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
   Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed).
   Inherited GIT_DIR-style env vars are dropped so they cannot point git at another repo or index, and the data/real
   segment is matched in any case (data/REAL on Windows is the same folder). */
const { spawnSync } = require('child_process');
const DROP = ['GIT_DIR', 'GIT_INDEX_FILE', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY'];
const REAL = /(^|\/)data\/real(\/|$)/i;
function trackedReal(dir) {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (DROP.includes(k.toUpperCase())) delete env[k];
  const r = spawnSync('git', ['-C', dir, 'ls-files', '-z'], { cwd: dir, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
  return { ok: true, files: r.stdout.split('\0').filter((f) => f && REAL.test(f)) };
}
module.exports = { trackedReal };
if (require.main === module) {
  const t = trackedReal(process.cwd());
  if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
  if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
  console.log('data-real-guard ok');
}
/* node tools/data-real-guard-selftest.js : exercises data-real-guard.js and its call from gate-check.js in a throwaway git repo
   (fake files only; the real data/real is never read). Prints data-real-guard-selftest ok or the first failure. */
const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
const fail = (m) => { console.log('data-real-guard-selftest FAIL: ' + m); process.exit(1); };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-real-guard-'));
const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });

// throwaway repo shaped like workiva: <repo>/fit-finder/tools/{gate-check,data-real-guard}.js copied from this checkout
const repo = path.join(tmp, 'repo'), ff = path.join(repo, 'fit-finder');
fs.mkdirSync(path.join(ff, 'tools'), { recursive: true });
fs.mkdirSync(path.join(ff, 'data', 'real'), { recursive: true });
for (const f of ['gate-check.js', 'data-real-guard.js']) fs.copyFileSync(path.join(__dirname, f), path.join(ff, 'tools', f));
if (git(repo, 'init', '-q').status !== 0) fail('git init');
fs.writeFileSync(path.join(ff, 'data', 'real', 'fake.jsonl'), '{"fake":"not real data"}\n');
fs.writeFileSync(path.join(ff, 'README.md'), 'x\n');
git(repo, 'add', 'fit-finder/README.md');

// a valid before-stage evidence doc (no-card 8, so no OUTCOME needed)
const line = 'first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits 8 (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)';
const ev = path.join(tmp, 'ev.md');
fs.writeFileSync(ev, ['BASE-SHA: ae60341', 'BEFORE-LINE: ' + line, 'BEFORE: feature 17 of 29, wrong 2, no card 8, not-a-fit 0', 'PREDICTION-PM: x', 'PREDICTION-LEAD: y'].join('\n') + '\n');
const gate = (env = {}) => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8', env: { ...process.env, ...env } });
const guard = (cwd, env = {}) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp, ...env } });
let n = 0;
const expect = (name, r, code, re) => {
  n++;
  if (r.status !== code || !re.test(r.stdout)) fail(`${name}: want exit ${code} matching ${re}, got ${r.status}: ${(r.stdout + r.stderr).trim()}`);
};

// 1-2. control: data/real exists on disk but is untracked, so guard and done check pass
expect('untracked guard', guard(ff), 0, /^data-real-guard ok/);
expect('untracked gate', gate(), 0, /^gate-check ok before/);

// 3-5. tracked: git add a file under data/real, and both fail naming it
git(repo, 'add', '-f', 'fit-finder/data/real/fake.jsonl');
expect('tracked guard', guard(ff), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
expect('tracked gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
const { trackedReal } = require(path.join(ff, 'tools', 'data-real-guard.js'));
const t = trackedReal(ff);
if (!t.ok || t.files.join() !== 'data/real/fake.jsonl') fail('trackedReal lists ' + JSON.stringify(t));
n++;

// 6-15. inherited git env vars that point git at another repo, index or tree must not hide the tracked file
const other = path.join(tmp, 'other');
fs.mkdirSync(other);
git(other, 'init', '-q');
const misleading = {
  GIT_DIR: path.join(other, '.git'),
  GIT_INDEX_FILE: path.join(tmp, 'empty-index'),
  GIT_WORK_TREE: other,
  GIT_COMMON_DIR: path.join(other, '.git'),
  GIT_OBJECT_DIRECTORY: path.join(other, '.git', 'objects'),
};
for (const [k, v] of Object.entries(misleading)) {
  expect(`${k} guard`, guard(ff, { [k]: v }), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
  expect(`${k} gate`, gate({ [k]: v }), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
}

// 16. untrack again: passes again
git(repo, 'rm', '-q', '--cached', 'fit-finder/data/real/fake.jsonl');
expect('untracked again gate', gate(), 0, /^gate-check ok before/);

// 17-19. a case variant (data/REAL) is caught too; put straight in the index so the test does not depend on the disk's case rules
const blob = git(repo, 'hash-object', '-w', 'fit-finder/data/real/fake.jsonl').stdout.trim();
git(repo, 'update-index', '--add', '--cacheinfo', `100644,${blob},fit-finder/data/REAL/x.jsonl`);
expect('case variant guard', guard(ff), 1, /data-real-guard FAIL: .*data\/REAL\/x\.jsonl/);
expect('case variant gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/REAL\/x\.jsonl/);
git(repo, 'update-index', '--force-remove', 'fit-finder/data/REAL/x.jsonl');
expect('case variant removed gate', gate(), 0, /^gate-check ok before/);

// 20. fails closed outside a git repo (git ls-files errors)
const bare = path.join(tmp, 'not-a-repo');
fs.mkdirSync(bare);
expect('no repo guard', guard(bare), 1, /data-real-guard FAIL: git ls-files failed/);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`data-real-guard-selftest ok (${n} checks)`);
/* node tools/gate-check.js <EV> --stage before|final [--no-git]
   Checks the gate evidence doc: summaries derived from the score lines, the keep rule, the REASON text, prediction order, git state. */
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const a = process.argv.slice(2);
const stage = a.indexOf('--stage') >= 0 ? a[a.indexOf('--stage') + 1] : '';
const noGit = a.includes('--no-git');
const file = a.find((x, i) => !x.startsWith('--') && a[i - 1] !== '--stage');
if (!file || !['before', 'final'].includes(stage)) { console.log('usage: gate-check.js <EV> --stage before|final [--no-git]'); process.exit(2); }
const root = path.join(__dirname, '..');
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
const get = (tag) => {
  const i = lines.findIndex((l) => l.startsWith(tag));
  return i < 0 ? null : { i, v: lines[i].slice(tag.length).trim() };
};
const bad = [];
// always, even with --no-git: real data must never be tracked (studio-harness F3)
const real = require('./data-real-guard.js').trackedReal(root);
if (!real.ok) bad.push(real.error);
else if (real.files.length) bad.push('data/real is tracked by git: ' + real.files.join(', '));
function parse(text) {
  const m = (re) => { const x = re.exec(text); return x ? +x[1] : NaN; };
  const s = /split: right feature first (\d+) of (\d+)/.exec(text);
  const r = { R: s ? +s[1] : NaN, F: s ? +s[2] : NaN, W: m(/wrong card (\d+)/), N: m(/no card where one fits (\d+)/), K: m(/card on a not-a-fit prompt (\d+)/) };
  return Object.values(r).some(Number.isNaN) ? null : r;
}
const derived = (x) => `feature ${x.R} of ${x.F}, wrong ${x.W}, no card ${x.N}, not-a-fit ${x.K}`;
function side(lineTag, sumTag) {
  const L = get(lineTag), S = get(sumTag);
  if (!L) { bad.push('missing ' + lineTag); return null; }
  const p = parse(L.v);
  if (!p) { bad.push(lineTag + ' lacks the score numbers'); return null; }
  if (!S) bad.push('missing ' + sumTag);
  else if (S.v !== derived(p)) bad.push(`${sumTag} should be "${derived(p)}"`);
  return { p, L };
}
const base = get('BASE-SHA:');
if (!base || !base.v) bad.push('missing BASE-SHA:');
const b = side('BEFORE-LINE:', 'BEFORE:');
const pm = get('PREDICTION-PM:'), lead = get('PREDICTION-LEAD:');
if (!pm) bad.push('missing PREDICTION-PM:');
if (!lead) bad.push('missing PREDICTION-LEAD:');
const outcome = get('OUTCOME:'), reason = get('REASON:');
let a1 = null;
const finalOutcome = outcome ? outcome.v : 'pending';
if (b) {
  const N0 = b.p.N, inconclusive = N0 < 6;
  if (inconclusive) {
    if (!outcome || outcome.v !== 'inconclusive') bad.push('before no-card < 6: OUTCOME must be inconclusive');
    if (!reason || reason.v !== `before no-card < 6 (${N0})`) bad.push(`REASON must be "before no-card < 6 (${N0})"`);
  }
  if (stage === 'final') {
    if (inconclusive) {
      if (get('AFTER-LINE:') || get('AFTER:')) bad.push('inconclusive run must have no AFTER-LINE or AFTER:');
    } else {
      a1 = side('AFTER-LINE:', 'AFTER:');
      if (!outcome || !['kept', 'reverted'].includes(outcome.v)) bad.push('OUTCOME must be kept or reverted');
      const al = get('AFTER-LINE:');
      if (al && pm && lead && (pm.i > al.i || lead.i > al.i)) bad.push('PREDICTION lines must come before AFTER-LINE');
      if (a1) {
        const x = b.p, y = a1.p, why = [];
        if (!(x.N - y.N >= 2)) why.push(`no-card fall < 2 (${x.N} to ${y.N})`);
        if (!(y.W <= x.W)) why.push(`wrong card rose (${x.W} to ${y.W})`);
        if (!(y.K <= x.K)) why.push(`not-a-fit card rose (${x.K} to ${y.K})`);
        const kept = why.length === 0, want = kept ? 'none' : why.join(' and ');
        if (outcome && outcome.v !== (kept ? 'kept' : 'reverted')) bad.push(`OUTCOME should be ${kept ? 'kept' : 'reverted'}`);
        if (!reason || reason.v !== want) bad.push(`REASON should be "${want}"`);
        const pr = get('PREDICTION:');
        if (!pr || pr.v !== (kept ? 'held' : 'did not hold')) bad.push(`PREDICTION: should be "${kept ? 'held' : 'did not hold'}"`);
      }
    }
  }
}
if (!noGit && base && base.v && !bad.length) {
  const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8' }).status;
  const sha = base.v, mf = path.join(root, 'tests/match-frozen.js');
  const same = run('git', ['diff', '--quiet', sha, 'HEAD', '--', ':(top)fit-finder/engine/fit.js']) === 0;
  if (finalOutcome === 'kept') {
    if (same) bad.push('kept but engine/fit.js equals BASE');
    if (run('node', [mf, '--base', sha, '--allow', 'engine']) !== 0) bad.push('match-frozen --allow engine fails');
    if (run('node', [mf, '--base', sha]) === 0) bad.push('match-frozen passes without --allow engine');
  } else {
    if (!same) bad.push('engine/fit.js differs from BASE but outcome is ' + finalOutcome);
    if (run('node', [mf, '--base', sha]) !== 0) bad.push('match-frozen --base fails');
  }
}
if (bad.length) { console.log('gate-check FAIL: ' + bad.join('; ')); process.exit(1); }
const f = (t, x) => `${t} feature ${x.R} of ${x.F} wrong ${x.W} no-card ${x.N} not-a-fit ${x.K}`;
console.log(`gate-check ok ${stage} ${finalOutcome}; ${f('before', b.p)}` + (a1 ? `; ${f('after', a1.p)}` : ''));

hook: PostToolUse
 succeeded in 1005ms:
## harness/f3-data-real-guard...origin/harness/f3-data-real-guard
3c059b4 fit-finder: data-real guard drops inherited GIT_DIR-style env vars and matches data/real in any case (Codex must-fixes)
cb3924d evidence: F3 Fit Finder Codex judge (Verdict: FAIL, 2 must-fixes)
d007e0b fit-finder: gate-check fails when data/real is tracked by git (studio-harness F3)
fb26061 Merge prompt-coach-c3-sandbox: C3 sandbox test (C3a 13/24 MISS, C3b 0/24 PASS, C3c 58 vs 63 MISS), evidence, next talk prompt
156034f Prompt coach C3: next talk prompt (after C3 miss)
2aec56c Prompt coach C3: README wording (final review note: "never run" read as current)
diff --git a/docs/evidence/2026-10-26-f3-data-real-guard.md b/docs/evidence/2026-10-26-f3-data-real-guard.md
new file mode 100644
index 0000000..2479664
--- /dev/null
+++ b/docs/evidence/2026-10-26-f3-data-real-guard.md
@@ -0,0 +1,59 @@
+# F3 (Fit Finder half): the done check fails when data/real is tracked
+
+studio-harness F3 (premortem 7): "the Fit Finder done check fails if data/real is git-tracked". Branch `harness/f3-data-real-guard`, based on `prompt-coach` fb26061. Run 2026-10-26 ~01:05Z on Ian's PC.
+
+## What changed
+
+- `fit-finder/tools/data-real-guard.js`: runs `git ls-files -- data/real` from `fit-finder/`; exit 1 if it lists anything, and exit 1 if git itself fails (fails closed). Lists paths only, never reads the files.
+- `fit-finder/tools/gate-check.js` (the Fit Finder done/gate check) calls it on every run, even with `--no-git`, and adds `data/real is tracked by git: <paths>` to its FAIL reasons.
+- `fit-finder/tools/data-real-guard-selftest.js`: test, written first. A throwaway git repo shaped like workiva gets copies of the real `gate-check.js` and `data-real-guard.js` and one fake file `fit-finder/data/real/fake.jsonl`. The real `data/real` is never opened.
+- `fit-finder/tools/README.md`: the gate-check row names the new failure; one row for the guard and its selftest.
+
+Choice logged: Fit Finder has no GOAL.md done line, so "the done check" is taken to be `tools/gate-check.js`, the only gate check script, and the guard is also runnable alone.
+
+## Test run (commands from `fit-finder/`)
+
+Red 1, guard not written: `node tools/data-real-guard-selftest.js` -> exit 1, `ENOENT ... copyfile ...tools\data-real-guard.js`.
+
+Red 2, guard written but not called by gate-check (the join):
+```
+data-real-guard-selftest FAIL: tracked gate: want exit 1 matching /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/, got 0: gate-check ok before pending; before feature 17 of 29 wrong 2 no-card 8 not-a-fit 0
+exit 1
+```
+
+Green, after the call in gate-check:
+```
+## data-real-guard-selftest
+data-real-guard-selftest ok (7 checks)
+exit 0
+## gate-selftest
+gate-selftest ok
+exit 0
+## data-real-guard on this checkout
+data-real-guard ok
+exit 0
+```
+
+The 7 checks: untracked file on disk passes (guard, gate); `git add -f` of the fake file fails (guard and gate, each naming the path; `trackedReal` lists exactly it); `git rm --cached` passes again; outside any repo the guard fails closed (`git ls-files failed`). On this checkout nothing under `data/real` is tracked.
+
+## Round 2: the two Codex must-fixes (2026-10-26 ~05:40Z, Ian's PC)
+
+The Codex judge of d007e0b (`docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md`) failed it on two must-fixes: inherited `GIT_INDEX_FILE` / `GIT_WORK_TREE` (and similar) make `git ls-files` print nothing and exit 0, and the case-sensitive `data/real` pathspec lets `data/REAL/...` past on Windows.
+
+Fix in `data-real-guard.js`: git runs as `git -C <fit-finder> ls-files -z` with `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` removed from its environment (any case of the name), and the output is filtered with `/(^|\/)data\/real(\/|$)/i`, so a `data/real` segment in any case, at any depth under `fit-finder/`, fails.
+
+Tests added first to the selftest (13 new checks, 20 in all):
+- checks 6-15: with the fake file tracked, each of the five env vars set to point at a second throwaway repo (or an empty index path), guard and gate must still fail naming `data/real/fake.jsonl`;
+- checks 17-19: `fit-finder/data/REAL/x.jsonl` put straight into the index with `git update-index --cacheinfo` (so the test does not depend on the disk's case rules) must fail guard and gate, and pass again once removed.
+
+Red against the old guard (each new check run alone in a scratch copy): `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE` and the `data/REAL` case each got `exit 0: data-real-guard ok`. `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` did not hide the file even before the fix; their checks stay as regression guards, not proof of the fix.
+
+Green after the fix:
+```
+## data-real-guard-selftest
+data-real-guard-selftest ok (20 checks)
+## gate-selftest
+gate-selftest ok
+## data-real-guard on this checkout
+data-real-guard ok
+```
diff --git a/docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md b/docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md
new file mode 100644
index 0000000..8923fa6
--- /dev/null
+++ b/docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md
@@ -0,0 +1,1692 @@
+# F3 (Fit Finder half): fresh Codex judge, 2026-10-26
+
+Command (from Ian's PC, codex-cli 0.163.0, branch harness/f3-data-real-guard at d007e0b; the prompt is echoed at the top of the output):
+
+```
+codex exec --sandbox read-only --ephemeral -C "C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard" "$(cat prompt.txt)" < /dev/null
+```
+
+Result: **Verdict: FAIL**, two must-fixes: (1) the guard inherits GIT_INDEX_FILE / GIT_WORK_TREE, which can make `git ls-files` print nothing and exit 0; (2) the `data/real` pathspec is case-sensitive, so on Windows `data/REAL/...` gets past it. The join with gate-check was judged sound in every mode, and the selftest not vacuous. The selftest could not run in the read-only sandbox (mkdtemp EPERM). Not fixed in this commit.
+
+## Full output
+
+````
+Reading additional input from stdin...
+OpenAI Codex v0.163.0
+--------
+workdir: C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+model: gpt-6.1-sol
+provider: openai
+approval: on-request
+sandbox: read-only
+reasoning effort: high
+reasoning summaries: none
+session id: 01a17667-870b-76b1-97fe-38ec9708b1ee
+--------
+user
+You are a fresh, independent judge. Review branch harness/f3-data-real-guard (commit d007e0b) of this repo. Read-only: do not edit files.
+
+HARD RULE: never open, list, cat, grep or git-show anything under fit-finder/data/ or any data/real path (real customer data and labels). Read only: fit-finder/tools/gate-check.js, fit-finder/tools/data-real-guard.js, fit-finder/tools/data-real-guard-selftest.js, fit-finder/tools/gate-selftest.js, fit-finder/tools/README.md, docs/evidence/2026-10-26-f3-data-real-guard.md, and git metadata (git log, git diff prompt-coach...HEAD -- fit-finder/tools docs/evidence). The sandbox is read-only, so the selftests may not run (they write to the temp dir); if so, judge from the code and the recorded output in the evidence file, and say so.
+
+Requirement (studio-harness F3): the Fit Finder done check (fit-finder/tools/gate-check.js) must fail whenever git tracks anything under data/real (that is, `git ls-files -- data/real` run from fit-finder/ prints anything), including failing when git itself errors. It must be proved by a test written first that uses a throwaway repo as the fixture, never the real data.
+
+Answer:
+1. Does gate-check.js fail whenever git tracks anything under fit-finder/data/real, in every mode (--no-git, --stage before, --stage final, any outcome)? Does it fail when git errors (not a repo, git missing, other failure)?
+2. Does data-real-guard-selftest.js prove it with a throwaway repo, testing the real gate-check join and not only the helper? Is any check vacuous (true by construction)?
+3. Try your own bypasses and name each one with its result: for example the cwd it runs from, paths with spaces or unusual names, files staged but not committed, files in subfolders, case differences on Windows, a data/real symlink, nested repos or submodules, GIT_DIR/GIT_WORK_TREE or similar env vars, sparse checkout or skip-worktree, a data/real path elsewhere in the repo, early exits in gate-check before the guard runs, the order of checks.
+
+Must-fix rule: a must-fix is anything that ordinary use or an honest mistake gets past. A deliberate trick counts as a must-fix only if the fix is small. List must-fixes first, then minor notes.
+
+End your reply with exactly one final line: "Verdict: PASS" (no must-fix) or "Verdict: FAIL" (one or more must-fixes).
+warning: loading hooks from both C:\Users\teasp\.codex\hooks.json and C:\Users\teasp\.codex\config.toml; prefer a single representation for this layer
+2026-10-26T04:11:03.900046Z ERROR codex_rmcp_client::oauth::refresh_transaction: error=failed to refresh OAuth tokens for server openart: OAuth refresh token was rejected: Server returned error response: invalid_grant: The refresh token is invalid, expired, or revoked.
+hook: SessionStart
+hook: SessionStart
+hook: SessionStart
+hook: SessionStart Completed
+hook: SessionStart Completed
+hook: SessionStart Completed
+hook: UserPromptSubmit
+hook: UserPromptSubmit Completed
+codex
+Time budget: about 15 minutes. I’ll review the allowed files and branch metadata, then try isolated bypass checks where the read-only sandbox permits them. I’ll leave all customer-data paths untouched.
+hook: PreToolUse
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node "C:/Users/teasp/Documents/studio-harness/plugin/scripts/live_copy.mjs"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 670ms:
+{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"LIVE COPY NOT UPDATED: fetch failed; 0 behind origin/main; this session runs old harness rules; say this in your first line to the user"}}
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PreToolUse
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node "C:/Users/teasp/Documents/studio-harness/plugin/scripts/goal_start.mjs"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 335ms:
+{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"NO GOAL.md in C:\\Users\\teasp\\Documents\\workiva\\.claude\\worktrees\\f3-data-real-guard: a hand-off from here will be refused by town-launch until Ian approves one."}}
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PreToolUse
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node "C:/Users/teasp/Documents/studio-harness/bin/brain.mjs" context' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 903ms:
+CHECKS
+Run node --test --test-name-pattern='git.exe|gh.exe' test/slip_guard.test.mjs; in a run with no slip, git.exe push, GIT.EXE push, a full path to git (forward or back slashes) and a full path to gh.exe pr merge must each exit 2. [2026-10-13-slip-guard-misses-git-exe]
+Run node --test --test-name-pattern='attached -C' test/slip_guard.test.mjs; from a work-branch repo, git -C<main repo> merge and git -C\"<main repo>\" merge must exit 2 while the same merge without -C exits 0. [2026-10-13-slip-guard-attached-c-merge]
+Run node --test --test-name-pattern='detail prefers the spawn error code' test/evalrun.test.mjs; a run whose spawn fails must name the error code in its detail, never UNKNOWN. [2026-09-06-spawn-failure-detail-carries-no-error-message]
+ASK
+node "C:\Users\teasp\Documents\studio-harness\bin\brain.mjs" query <words> | show <page-id> | gate "<task>" | why <page>
+
+hook: PostToolUse
+hook: PostToolUse Completed
+codex
+The required startup checks report that the harness refresh failed and this worktree has no GOAL.md. Neither blocks this read-only review. I’m applying `$superpowers:using-superpowers`, `$task-observer`, and `$superpowers:verification-before-completion`; I won’t write review notes into the repo or shared memory.
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git log -5 --oneline --decorate' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath "C:/Users/teasp/.agents/skills/task-observer/SKILL.md"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath "C:/Users/teasp/.codex/plugins/cache/superpowers-marketplace/superpowers/7.0.1/skills/using-superpowers/SKILL.md"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff prompt-coach...HEAD -- fit-finder/tools docs/evidence' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 662ms:
+d007e0b (HEAD -> harness/f3-data-real-guard, origin/harness/f3-data-real-guard) fit-finder: gate-check fails when data/real is tracked by git (studio-harness F3)
+fb26061 (origin/backup/prompt-coach-before-prompt-coach-sod-conflict-2026-10-25) Merge prompt-coach-c3-sandbox: C3 sandbox test (C3a 13/24 MISS, C3b 0/24 PASS, C3c 58 vs 63 MISS), evidence, next talk prompt
+156034f (origin/prompt-coach-c3-sandbox, prompt-coach-c3-sandbox) Prompt coach C3: next talk prompt (after C3 miss)
+2aec56c Prompt coach C3: README wording (final review note: "never run" read as current)
+ab6e654 Prompt coach C3 sandbox: results (C3a/C3b/C3c)
+
+hook: PostToolUse
+ succeeded in 483ms:
+diff --git a/docs/evidence/2026-10-26-f3-data-real-guard.md b/docs/evidence/2026-10-26-f3-data-real-guard.md
+new file mode 100644
+index 0000000..b7329e2
+--- /dev/null
++++ b/docs/evidence/2026-10-26-f3-data-real-guard.md
+@@ -0,0 +1,37 @@
++# F3 (Fit Finder half): the done check fails when data/real is tracked
++
++studio-harness F3 (premortem 7): "the Fit Finder done check fails if data/real is git-tracked". Branch `harness/f3-data-real-guard`, based on `prompt-coach` fb26061. Run 2026-10-26 ~01:05Z on Ian's PC.
++
++## What changed
++
++- `fit-finder/tools/data-real-guard.js`: runs `git ls-files -- data/real` from `fit-finder/`; exit 1 if it lists anything, and exit 1 if git itself fails (fails closed). Lists paths only, never reads the files.
++- `fit-finder/tools/gate-check.js` (the Fit Finder done/gate check) calls it on every run, even with `--no-git`, and adds `data/real is tracked by git: <paths>` to its FAIL reasons.
++- `fit-finder/tools/data-real-guard-selftest.js`: test, written first. A throwaway git repo shaped like workiva gets copies of the real `gate-check.js` and `data-real-guard.js` and one fake file `fit-finder/data/real/fake.jsonl`. The real `data/real` is never opened.
++- `fit-finder/tools/README.md`: the gate-check row names the new failure; one row for the guard and its selftest.
++
++Choice logged: Fit Finder has no GOAL.md done line, so "the done check" is taken to be `tools/gate-check.js`, the only gate check script, and the guard is also runnable alone.
++
++## Test run (commands from `fit-finder/`)
++
++Red 1, guard not written: `node tools/data-real-guard-selftest.js` -> exit 1, `ENOENT ... copyfile ...tools\data-real-guard.js`.
++
++Red 2, guard written but not called by gate-check (the join):
++```
++data-real-guard-selftest FAIL: tracked gate: want exit 1 matching /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/, got 0: gate-check ok before pending; before feature 17 of 29 wrong 2 no-card 8 not-a-fit 0
++exit 1
++```
++
++Green, after the call in gate-check:
++```
++## data-real-guard-selftest
++data-real-guard-selftest ok (7 checks)
++exit 0
++## gate-selftest
++gate-selftest ok
++exit 0
++## data-real-guard on this checkout
++data-real-guard ok
++exit 0
++```
++
++The 7 checks: untracked file on disk passes (guard, gate); `git add -f` of the fake file fails (guard and gate, each naming the path; `trackedReal` lists exactly it); `git rm --cached` passes again; outside any repo the guard fails closed (`git ls-files failed`). On this checkout nothing under `data/real` is tracked.
+diff --git a/fit-finder/tools/README.md b/fit-finder/tools/README.md
+index 4d51b38..9e07528 100644
+--- a/fit-finder/tools/README.md
++++ b/fit-finder/tools/README.md
+@@ -16,7 +16,8 @@ Small scripts for the BCA run. Run them from `fit-finder/` (paths are relative t
+ | `keep-check.js` | `<EV>` | `keep-check ok <outcome>` | 1 if the rule, the written REASON or the git state disagree |
+ | `ops-check.js` | `<base sha>` | `ops-check ok <n> cards changed` | 1 on any violation |
+ | `diag-nocard.js`, `diag-selftest.js` | `[--engine <path>]` (self-test only); selftest: none (needs `FF_LEDGER`) | `diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K`; selftest `diag-selftest ok` | 1 with `INVALID: ...` if tune wrong > 4, tune not-a-fit > BASE_K or half A wrong > 0; 2 on bad input. Reads only the tune set and half A |
+-| `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees |
++| `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees, or (always, even with `--no-git`) git tracks anything under `data/real` |
++| `data-real-guard.js`, `data-real-guard-selftest.js` | none | `data-real-guard ok` / `data-real-guard FAIL: data/real is tracked by git: <paths>`; `data-real-guard-selftest ok (7 checks)` | 1 if `git ls-files -- data/real` lists anything or itself fails; lists paths only, never reads the files. The selftest uses a throwaway repo with a fake file |
+ | `engine-scope.js`, `gate-selftest.js` | `--git <sha>` or `--files <base> <new>`; selftest: none | `engine-scope ok` / `engine-scope FAIL: <problems>`; `gate-selftest ok` | 1 if `engine/fit.js` differs from the base outside the `OPS` block and the `let fit;`..`return { fit,` gate block (line endings ignored), an OPS key changed, or an added line has Date/performance/location/http/fetch/require(/process |
+ | `selftest.js` | none | `selftest ok` or `selftest FAIL: ...` | 1 on the first failure |
+ 
+diff --git a/fit-finder/tools/data-real-guard-selftest.js b/fit-finder/tools/data-real-guard-selftest.js
+new file mode 100644
+index 0000000..d7ab6b3
+--- /dev/null
++++ b/fit-finder/tools/data-real-guard-selftest.js
+@@ -0,0 +1,53 @@
++/* node tools/data-real-guard-selftest.js : exercises data-real-guard.js and its call from gate-check.js in a throwaway git repo
++   (fake files only; the real data/real is never read). Prints data-real-guard-selftest ok or the first failure. */
++const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
++const fail = (m) => { console.log('data-real-guard-selftest FAIL: ' + m); process.exit(1); };
++const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-real-guard-'));
++const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
++
++// throwaway repo shaped like workiva: <repo>/fit-finder/tools/{gate-check,data-real-guard}.js copied from this checkout
++const repo = path.join(tmp, 'repo'), ff = path.join(repo, 'fit-finder');
++fs.mkdirSync(path.join(ff, 'tools'), { recursive: true });
++fs.mkdirSync(path.join(ff, 'data', 'real'), { recursive: true });
++for (const f of ['gate-check.js', 'data-real-guard.js']) fs.copyFileSync(path.join(__dirname, f), path.join(ff, 'tools', f));
++if (git(repo, 'init', '-q').status !== 0) fail('git init');
++fs.writeFileSync(path.join(ff, 'data', 'real', 'fake.jsonl'), '{"fake":"not real data"}\n');
++fs.writeFileSync(path.join(ff, 'README.md'), 'x\n');
++git(repo, 'add', 'fit-finder/README.md');
++
++// a valid before-stage evidence doc (no-card 8, so no OUTCOME needed)
++const line = 'first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits 8 (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)';
++const ev = path.join(tmp, 'ev.md');
++fs.writeFileSync(ev, ['BASE-SHA: ae60341', 'BEFORE-LINE: ' + line, 'BEFORE: feature 17 of 29, wrong 2, no card 8, not-a-fit 0', 'PREDICTION-PM: x', 'PREDICTION-LEAD: y'].join('\n') + '\n');
++const gate = () => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8' });
++const guard = (cwd) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp } });
++let n = 0;
++const expect = (name, r, code, re) => {
++  n++;
++  if (r.status !== code || !re.test(r.stdout)) fail(`${name}: want exit ${code} matching ${re}, got ${r.status}: ${(r.stdout + r.stderr).trim()}`);
++};
++
++// 1-2. control: data/real exists on disk but is untracked, so guard and done check pass
++expect('untracked guard', guard(ff), 0, /^data-real-guard ok/);
++expect('untracked gate', gate(), 0, /^gate-check ok before/);
++
++// 3-5. tracked: git add a file under data/real, and both fail naming it
++git(repo, 'add', '-f', 'fit-finder/data/real/fake.jsonl');
++expect('tracked guard', guard(ff), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
++expect('tracked gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
++const { trackedReal } = require(path.join(ff, 'tools', 'data-real-guard.js'));
++const t = trackedReal(ff);
++if (!t.ok || t.files.join() !== 'data/real/fake.jsonl') fail('trackedReal lists ' + JSON.stringify(t));
++n++;
++
++// 6. untrack again: passes again
++git(repo, 'rm', '-q', '--cached', 'fit-finder/data/real/fake.jsonl');
++expect('untracked again gate', gate(), 0, /^gate-check ok before/);
++
++// 7. fails closed outside a git repo (git ls-files errors)
++const bare = path.join(tmp, 'not-a-repo');
++fs.mkdirSync(bare);
++expect('no repo guard', guard(bare), 1, /data-real-guard FAIL: git ls-files failed/);
++
++fs.rmSync(tmp, { recursive: true, force: true });
++console.log(`data-real-guard-selftest ok (${n} checks)`);
+diff --git a/fit-finder/tools/data-real-guard.js b/fit-finder/tools/data-real-guard.js
+new file mode 100644
+index 0000000..4e60565
+--- /dev/null
++++ b/fit-finder/tools/data-real-guard.js
+@@ -0,0 +1,15 @@
++/* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
++   Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed). */
++const { spawnSync } = require('child_process');
++function trackedReal(dir) {
++  const r = spawnSync('git', ['ls-files', '--', 'data/real'], { cwd: dir, encoding: 'utf8' });
++  if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
++  return { ok: true, files: r.stdout.split(/\r?\n/).filter(Boolean) };
++}
++module.exports = { trackedReal };
++if (require.main === module) {
++  const t = trackedReal(process.cwd());
++  if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
++  if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
++  console.log('data-real-guard ok');
++}
+diff --git a/fit-finder/tools/gate-check.js b/fit-finder/tools/gate-check.js
+index 54ffe57..6d691d4 100644
+--- a/fit-finder/tools/gate-check.js
++++ b/fit-finder/tools/gate-check.js
+@@ -13,6 +13,10 @@ const get = (tag) => {
+   return i < 0 ? null : { i, v: lines[i].slice(tag.length).trim() };
+ };
+ const bad = [];
++// always, even with --no-git: real data must never be tracked (studio-harness F3)
++const real = require('./data-real-guard.js').trackedReal(root);
++if (!real.ok) bad.push(real.error);
++else if (real.files.length) bad.push('data/real is tracked by git: ' + real.files.join(', '));
+ function parse(text) {
+   const m = (re) => { const x = re.exec(text); return x ? +x[1] : NaN; };
+   const s = /split: right feature first (\d+) of (\d+)/.exec(text);
+
+hook: PostToolUse
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath "C:/Users/teasp/.codex/plugins/cache/superpowers-marketplace/superpowers/7.0.1/skills/verification-before-completion/SKILL.md"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 1250ms:
+---
+name: using-superpowers
+description: Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions
+---
+
+<SUBAGENT-STOP>
+If you were dispatched as a subagent to execute a specific task, ignore this skill.
+</SUBAGENT-STOP>
+
+<EXTREMELY-IMPORTANT>
+If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.
+
+IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
+
+This is not negotiable. You cannot rationalize your way out of this.
+</EXTREMELY-IMPORTANT>
+
+## The Rule
+
+**Invoke relevant or requested skills BEFORE any response or action** �?" including clarifying questions, exploring the codebase, or checking files. If it turns out wrong for the situation, you don't have to use it.
+
+**Before entering plan mode:** if you haven't already brainstormed, invoke the brainstorming skill first.
+
+Then announce "Using [skill] to [purpose]" and follow the skill exactly. If it has a checklist, create a todo per item.
+
+## Skill Priority
+
+When multiple skills apply, process skills come first �?" they set the approach, then implementation skills (frontend-design, etc.) carry it out. Brainstorming and systematic-debugging are Superpowers' most common process skills, but the rule holds for any of them.
+
+- "Let's build X" �+' superpowers:brainstorming first, then implementation skills.
+- "Fix this bug" �+' superpowers:systematic-debugging first, then domain skills.
+
+## Red Flags
+
+These thoughts mean STOP�?"you're rationalizing:
+
+| Thought | Reality |
+|---------|---------|
+| "This is just a simple question" | Questions are tasks. Check for skills. |
+| "I need more context first" | Skill check comes BEFORE clarifying questions. |
+| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
+| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
+| "Let me gather information first" | Skills tell you HOW to gather information. |
+| "This doesn't need a formal skill" | If a skill exists, use it. |
+| "I remember this skill" | Skills evolve. Read current version. |
+| "This doesn't count as a task" | Action = task. Check for skills. |
+| "The skill is overkill" | Simple things become complex. Use it. |
+| "I'll just do this one thing first" | Check BEFORE doing anything. |
+| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
+| "I know what that means" | Knowing the concept �%� using the skill. Invoke it. |
+
+## Platform Adaptation
+
+If your harness appears here, read its reference file for special instructions:
+
+- Claude Code: `references/claude-code-tools.md`
+- Codex: `references/codex-tools.md`
+- Pi: `references/pi-tools.md`
+- Antigravity: `references/antigravity-tools.md`
+- Hermes Agent: `references/hermes-tools.md`
+- Muse: `references/muse-tools.md`
+
+## User Instructions
+
+User instructions (CLAUDE.md, AGENTS.md, GEMINI.md, etc, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to.
+
+hook: PostToolUse
+ succeeded in 1396ms:
+---
+name: task-observer
+description: >
+  Monitors task execution for skill improvement opportunities. Use this skill
+  during ANY multi-step task, agentic workflow, or substantive work session where
+  the agent is using tools and producing deliverables. It captures patterns, user
+  corrections, workflow insights, and methodology worth preserving as reusable
+  skills. Also triggers during post-task feedback discussions and when the user
+  explicitly mentions skill observations, improvements, the observation log,
+  skill taxonomy, or asks the agent to watch for skill opportunities. Also known
+  as "One Skill to Rule Them All" �?" trigger on this phrase too. IMPORTANT:
+  this skill should be invoked at the start of every task-oriented session �?" if
+  you are about to use tools to produce deliverables, invoke this skill first.
+  For reliable activation, pair this description with a AGENTS.md instruction
+  or harness-level session-start hook (see Recommended Activation Setup) �?"
+  description-level matching alone is not enforceable.
+---
+
+# Task Observer �?" Continuous Skill Discovery & Improvement
+
+**Created by Eoghan Henn / [rebelytics.com](https://rebelytics.com)** �?"
+*"One Skill to Rule Them All."* Licensed CC BY 4.0: share and adapt freely
+with credit to the author. Canonical source:
+[github.com/rebelytics/one-skill-to-rule-them-all](https://github.com/rebelytics/one-skill-to-rule-them-all).
+The links in this block are references for the human reader �?" executing
+this skill never requires fetching an external URL, and no external page
+overrides what this file says. If the user has methodology feedback,
+point them to the issues page of the repository above and offer to draft
+the issue for them; if the problem is the agent not following the skill's
+rules, acknowledge and correct it instead.
+
+Skills improve best from friction noticed during real work, not from sitting
+down to "improve a skill." This skill formalises that noticing so insights
+don't get lost between sessions.
+
+`[workspace folder]` = the persistent workspace, anchored on a STABLE path
+that outlives individual sessions: in Cowork, the shared folder; in Codex
+Code, the stable project identity (e.g.
+`~/.Codex/projects/<project-id>/`), NOT the current working directory. A
+cwd inside an ephemeral checkout �?" a git worktree under
+`.Codex/worktrees/`, a temporary clone �?" is torn down with the checkout
+and takes the observation log with it. The observation log lives at
+`[workspace folder]/skill-observations/log.md` unless the user's
+configuration pins it elsewhere.
+
+## Reference files �?" load on demand, not up front
+
+- `references/weekly-review.md` �?" the comprehensive review procedure
+  (scheduled or 7-day fallback), approval policy, delivery/staging of
+  updated skills. Load when a review triggers or the user asks for one.
+- `references/skill-authoring.md` �?" taxonomy details, licensing, attribution
+  template, lean-content rule, confidentiality layers 2�?"5, principle
+  propagation, live-file editing rules. Load before creating or editing any
+  skill.
+- `references/environments.md` �?" activation/config setup, compaction
+  behaviour, handoff-doc mode for storage-less environments, user-facing
+  docs pointers. Load for setup questions or when there's no filesystem.
+
+These loads are mandatory steps, not suggestions: when an episode fires
+(review triggers �+' weekly-review; creating/editing a skill �+'
+skill-authoring; setup/no-filesystem �+' environments), load the file before
+proceeding �?" never improvise the episode from this core file. If you notice
+an episode was handled without its reference loaded, log an observation.
+
+**Bundle manifest:** this skill consists of `SKILL.md` plus the three
+reference files listed above. If a referenced file is missing, the install
+is incomplete: proceed using the rules in this file, tell the user which
+files are missing, and point them to the full bundle at the canonical
+source (for the published version, the repository in the attribution
+above).
+
+## Session Start Protocol
+
+1. If `skill-observations/log.md` or `cross-cutting-principles.md` don't
+   exist, create them (templates below / in the principles section of
+   `references/skill-authoring.md`). Also create
+   `skill-observations/last-review-date.txt` containing the literal value
+   `never` if it doesn't exist �?" never write a date into it at setup; a
+   date means a review actually ran. Before creating or writing anything:
+   if the resolved workspace folder sits under an ephemeral path (e.g.
+   `.Codex/worktrees/`, a temporary clone), warn the user and re-anchor
+   on the stable project path first �?" state written to an ephemeral
+   checkout is lost at teardown.
+2. Scan OPEN observations and active principles; hold them in awareness,
+   don't surface unprompted.
+3. Read `skill-observations/last-review-date.txt`. The value carries the
+   truth: a date = when the last review actually ran; `never` = no review
+   has run yet. A missing file is abnormal (step 1 creates it) �?" recreate
+   it with `never`, don't invent a date. If the value is `never` or older
+   than 7 days AND there are OPEN observations: in an interactive session,
+   offer the review in one line ("the observation backlog hasn't been
+   reviewed [in N days / yet] �?" run it now, or carry on with your task?")
+   and proceed with the user's task unless they opt in; never gate their
+   work on the review. Only a scheduled/autonomous run loads
+   `references/weekly-review.md` and runs the review unprompted.
+4. Once per session: if no AGENTS.md (or equivalent) activation instruction
+   for this skill exists, briefly suggest adding one (see
+   `references/environments.md`). Skip if already configured.
+5. Note the log's modification time. If modified in the last few hours,
+   another session may be writing to it �?" re-read immediately before every
+   append, never trust a remembered "current number".
+
+## When to Observe
+
+Active for the entire task session: execution, post-task feedback and
+review discussion, meta-discussion about skills or methodology, and
+reflective/strategy conversations about how work should be done. **The
+observation mindset does not deactivate when the conversation shifts from
+doing the work to discussing it** �?" user feedback in review phases is often
+the highest-signal input. Inactive only for casual conversation and quick
+factual questions with no tools or deliverables involved.
+
+## What to Watch For
+
+**Signals for a NEW skill:** a reusable multi-step workflow; a methodology
+the user explains that no existing skill captures; a recurring task type
+with similar structure; a process with clear inputs, phases, outputs; the
+user describing a refined process ("I always do it this way"); a structured
+approach emerging naturally during work.
+
+**Signals for IMPROVING an existing skill:** anything from a task that used
+a skill and could make it better �?" problems, positive signals, or neutral
+gaps. Examples: the agent violates a documented rule (the skill needs
+enforcement, not louder rules); a user correction reveals a missing rule or
+edge case; a better workflow emerges than the skill recommends; a technique
+works well enough to promote from incidental to recommended; an undocumented
+use case; feedback that generalises; a wrong assumption; new tooling
+obsoletes a step; corrections forming a pattern; a principle that applies to
+other skills too; a naming/framing/structural suggestion, even
+conversational.
+
+**Signals for SIMPLIFYING a skill:** a section never relevant across many
+sessions; a rule from a single unvalidated observation; workflows users
+consistently shortcut; sections loaded but never acted on; contradictory
+rules; "just in case" complexity that never triggered; a rule the agent
+consistently fails to follow (convert to structural enforcement �?" checklist,
+verification step, unskippable tool call �?" or remove it). Treat these as a
+review checklist; ask "what can we remove?" as deliberately as "what should
+we add?"
+
+**Do NOT log:** one-off corrections that don't generalise; preferences
+already captured in a skill; tool bugs unrelated to methodology;
+observations that would need proprietary client information to be useful in
+an open-source skill (unless an internal skill is the right home).
+
+## How to Log
+
+Append to the log **silently, within the same turn or the next** �?" never
+batch mentally for later; the act of writing is the enforcement mechanism.
+
+**Mandatory observation checkpoint after every 3rd TodoWrite completion:** After
+marking the 3rd, 6th, 9th (etc.) TodoWrite item as completed in a session, you
+must **write to the log** �?" not merely pause to ask yourself a question. Either
+append any pending observations, or, if genuinely none have accumulated, append
+an explicit acknowledgement marker (a one-line `no observations` note for that
+checkpoint). The required action is a concrete log write; a remembered "ask
+whether" is not enforcement. This is a hard checkpoint, not a suggestion �?" the
+skill has demonstrated that softer "check when completing items" or "pause and
+ask" guidance gets lost during cognitively demanding analytical work, exactly
+when the most observations accumulate. The count doesn't need to be precise;
+the rule is: roughly every third completion, write to the log (observations or
+the acknowledgement marker). The write itself is the enforcement mechanism: it
+forces the mental check to surface as a recorded action, and it prevents the
+common failure mode where the skill is loaded but no observations are written
+until the user explicitly asks.
+
+**Deliverable-event flush:** Hard enforcement that hooks onto tool calls you are
+already making is the only reliable mechanism; soft prompts that rely on memory
+don't survive cognitive load during long substantive sessions (when the most
+insights surface). So tie observation-flushing to deliverable and workflow events
+that already involve a tool call. Whenever you present or render a major
+deliverable �?" `present_files`, a deck or PDF render, a staged skill file handed
+to the user �?" or complete a task/todo batch, flush any pending observations to
+the log at that moment, before moving on. These are natural, already-occurring
+checkpoints; piggy-backing the flush onto them means the write happens as a
+side effect of work you were doing anyway, rather than depending on a separate
+act of memory.
+
+**Numbering discipline (mandatory, every append):**
+
+1. *Pre-check:* read the actual log and find the highest existing number �?"
+   never trust session memory:
+
+   ```bash
+   # GNU grep:
+   grep -oP '### Observation \K\d+' log.md | sort -n | tail -1
+   # macOS / POSIX:
+   grep -o '### Observation [0-9]*' log.md | grep -o '[0-9]*' | sort -n | tail -1
+   ```
+
+2. *Pre-write assertion:* immediately before appending, confirm the proposed
+   number doesn't already exist:
+
+   ```bash
+   PROPOSED=$(( $(grep -oP '### Observation \K\d+' log.md | sort -n | tail -1) + 1 ))
+   grep -qE "^### Observation ${PROPOSED}:" log.md && {
+     echo "COLLISION on #${PROPOSED}"; exit 1; }
+   ```
+
+   If it fires, increment past all existing numbers and re-check (and log a
+   meta-observation �?" it signals a parallel-session collision).
+
+3. *Post-write verification:* after appending, count occurrences of the
+   number; if >1, a parallel writer collided between check and write �?"
+   renumber YOUR entry to max+1. Identify your entry from your own append
+   operation (capture the file's line count immediately before and after
+   your `>>`; your entry starts at the old line count + 1) �?" do NOT
+   re-grep and take the last occurrence, which may be a colliding writer's
+   entry appended after yours. After any `sed` renumber, re-read the
+   affected line to confirm the substitution actually took effect �?" a
+   line-addressed `s///` whose target shifted finds no match and still
+   exits 0. Pre-write catches stale reads; only a post-write check catches
+   the race. The pattern for shared logs written by parallel agents is
+   check-then-act-then-verify.
+
+**Log-write safety �?" never let a mutation span entry boundaries:** When
+mutating the log programmatically (marking entries ACTIONED/DECLINED,
+archiving, renumbering), a greedy or DOTALL pattern over the whole file can
+silently swallow everything from one match to EOF. This has happened: a
+`.*$` under `re.S` over the multi-entry file captured from one entry's
+Status line to end-of-file and overwrote 16 later entries in a single
+substitution. The log is shared state across many entries; mutate it one
+bounded entry at a time and verify every mutation.
+
+1. **Re-read and merge immediately before any write-back.** Any full-file
+   rewrite (archival, renumbering, reassembly from chunks) built from a
+   snapshot destroys whatever concurrent sessions appended after that
+   snapshot �?" the write-back succeeds, the victim gets no error, and the
+   loss is invisible. This has happened in production: a parallel session's
+   write-back erased two entries appended minutes earlier, hours after the
+   exact failure mode had been documented. So: take the snapshot, prepare
+   the mutation, then �?" immediately before writing �?" re-read the live log
+   and diff against the snapshot. If new entries appeared, merge them into
+   the write-back (or rebuild from the fresh read). Never write back a
+   stale snapshot.
+
+2. **Isolate the target entry, or anchor to a single line.** Either split
+   the log on `### Observation N:` headers, edit the TARGET entry's chunk in
+   isolation, and reassemble �?" OR, for a status-only edit, use a strictly
+   line-anchored multiline substitution that cannot cross a newline, e.g.
+   `re.sub(r'(?m)^(\s*-?\s*)\*\*Status:\*\*.*$', ...)` (multiline `^...$`
+   bounds the match to one line). NEVER use a DOTALL/greedy pattern across
+   the multi-entry file.
+
+3. **Assert a structural invariant against the LIVE pre-write file.** Count
+   `### Observation` headers in the live file immediately before writing and
+   again after. For a status-only edit the count MUST be unchanged; for
+   archival or append it must change by exactly the expected number. The
+   baseline must be the live file at write time, NOT your session's earlier
+   snapshot �?" an invariant computed against a stale snapshot validates that
+   you wrote what you intended while still destroying what others wrote in
+   between. Fail loudly if the count is off.
+
+4. **Keep the pre-write backup.** Copy `log.md` before any programmatic
+   mutation. This is what made full recovery trivial when the truncation
+   above occurred �?" it turned a destructive bug into a non-event.
+
+5. **Verify your entries SURVIVED, not just that they were written.** A
+   successful append proves nothing an hour later �?" a concurrent session's
+   write-back can silently delete it, and only the destroying session gets
+   any signal (none). Before surfacing observations at session end, grep
+   the log for every entry number this session wrote and confirm each still
+   exists exactly once; re-append any that are missing (with fresh numbers)
+   and log a meta-observation about the collision.
+
+Principle: a log shared across many entries must be mutated one bounded
+entry at a time; every rewrite must be based on a fresh read, verified by a
+structural invariant against the live pre-write file, and backed up. Writers
+must verify survival, not just successful writes �?" in a concurrent erase,
+the victim gets no error.
+
+**Format and insertion:** always `### Observation NNN:`, always appended to
+the END of the log, never mid-file, never alternative ID formats. One
+format, one insertion point. **Every new observation MUST include
+`**Status:** OPEN` as its first field �?" this is mandatory at write time, not
+optional.** Reviews classify entries by their Status line; an observation
+written without one is invisible to any status-filtered pass and risks being
+silently skipped instead of triaged.
+
+```markdown
+### Observation [N]: [Short descriptive title]
+
+**Status:** OPEN
+**Date:** [date]
+**Session context:** [what task was being worked on]
+**Skill:** [existing skill name, or "New skill candidate: [working name]"]
+**Type:** [open-source | internal]
+**Phase/Area:** [which part of the skill or workflow]
+
+**Issue:** [What happened �?" specific enough to understand weeks later
+without the original conversation.]
+
+**Suggested improvement:** [Concrete change. For existing skills, name the
+section or rule; for new skills, scope and key components.]
+
+**Principle:** [The generalisable takeaway �?" the most important field.]
+```
+
+**Context preservation:** if an observation depends on session-local data
+(uploads, API output), save that context into the workspace first and add a
+`**Reference file:**` line �?" an observation whose evidence dies with the
+session is incomplete.
+
+**Confidentiality at logging time:** for `type: open-source` observations,
+the Issue/Improvement fields may reference specifics for context, but the
+Principle must be fully generalised �?" no client names, domains, or details
+traceable to a real project. Full confidentiality layers for skill
+authoring: `references/skill-authoring.md`.
+
+## Referencing Observations
+
+When citing an observation by number �?" in conversation, in a review report,
+or from within another observation �?" the number must come from the entry's
+literal `### Observation N:` header line. Never cite an observation number
+that wasn't read from that header.
+
+- **Search-tool line numbers are positional metadata, not IDs.** `grep -n`
+  prefixes every match with a line number; when a match lands mid-entry
+  (e.g., on a Session context or Principle line rather than the header),
+  that line number is NOT the observation number. Resolve to the owning
+  header first �?" scan backwards from the matched line to the nearest
+  preceding `### Observation N:` header and take the number from there
+  (e.g., an awk backwards-scan, or re-grep for `^### Observation` and pick
+  the last header line before the match).
+- **Plausibility check (cheap second layer):** before quoting any
+  observation number, compare it against the known counter range �?" the
+  highest `### Observation N:` header in the log. A number outside that
+  range (e.g., citing #1365 when the log's counter is at #766) is almost
+  certainly a line number or other positional artefact misread as an ID.
+
+The general rule: IDs must come from the record's own identifier field,
+never from the positional metadata of the search tool that found it.
+
+## Taxonomy (quick version)
+
+**Open-source** �?" client-agnostic, methodology-driven, useful to other
+practitioners. **Internal** �?" contains user/client/project specifics or
+personal preferences. Default to open-source when it could go either way,
+stripping specifics. The boundary is also a confidentiality boundary. Full
+requirements (attribution, licensing, structure): `references/skill-authoring.md`.
+
+## Archival on Write
+
+On every log write, first move already-resolved entries to
+`skill-observations/archive/log-[YYYY-MM-DD].md` (preserving the log header
+in the archive). "Already resolved" is decided by date, read from the file:
+a resolved status MUST record its date �?" `ACTIONED (YYYY-MM-DD) �?" [what was
+done]` / `DECLINED (YYYY-MM-DD) �?" [reason]` �?" and archival moves only
+entries whose recorded date is before today. Entries resolved today stay in
+the active log until the next day, no matter which session resolved them:
+the grace period lives in the file, never in session memory, so it holds
+across parallel and subsequent sessions. A resolved entry with no readable
+date gets today's date added instead of being archived. The active log
+keeps its header, status key, all OPEN entries, and the same-day-resolved
+ones.
+
+Archival is a read-filter-rewrite �?" the highest-risk mutation the log
+undergoes, and the one that has destroyed concurrent appends in production.
+It MUST follow the full Log-write safety sequence above: backup, re-read
+the live log immediately before writing back and merge any entries that
+appeared since the snapshot, then verify the post-write header count equals
+the live pre-write count minus exactly the number of archived entries.
+
+## Log Structure
+
+```markdown
+# Skill Observation Log
+
+Observations captured during task-oriented work.
+
+**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill
+updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue �?"
+resolved statuses always carry their resolution date
+
+---
+
+## [Date]
+
+### Observation 1: [Title]
+**Status:** OPEN
+[... full format ...]
+```
+
+## Surfacing Protocol
+
+Default: at end of session, as a grouped summary �?" improvements grouped by
+skill, new-skill candidates listed separately; for each, one sentence plus
+suggested type; ask which to act on. Surface earlier when an observation
+needs user input to be complete, when a skill is actively producing wrong
+output, or when observations cluster on one skill.
+
+**Default to log-and-defer.** Surfacing an observation is not an invitation
+to act on it. The default is log-and-defer: state that the observation is
+logged for the next review, and stop. Reserve in-session application
+strictly for the two triggers already defined under "Acting on
+Observations" �?" an explicit user request that names the action, or
+correcting a skill that is producing wrong output in the current session.
+
+Do NOT routinely offer a binary "apply now vs leave for next review" choice
+when surfacing observations. For users who run regular reviews, that offer is
+unwanted friction repeated every session. If a user has expressed a standing
+preference to always defer to the next review, suppress the in-session
+"act now?" offer entirely rather than asking each time.
+
+**Self-check before surfacing:** observations were logged throughout the
+whole session (including discussion phases); logged silently; each follows
+Issue �+' Improvement �+' Principle; each is typed; existing-skill items name
+the section; no open-source Principle contains client-identifying info;
+every appended observation carries a Status line (`**Status:** OPEN` at
+write time) �?" a statusless entry is invisible to any status-filtered review
+pass, so if any observation lacks one, add it now. Finally, run the
+survival check (Log-write safety rule 5): grep the log for every entry
+number this session wrote and confirm each still exists exactly once �?" a
+concurrent session's write-back deletes silently. Fix failures before
+surfacing.
+
+## Acting on Observations
+
+Act only in three contexts: (1) the comprehensive review (load
+`references/weekly-review.md`); (2) an explicit user request ("update X
+skill", "act on observation #N"); (3) in-session correction when a skill is
+producing wrong output the user should know about. Otherwise: log, don't
+act.
+
+When acting: small, clearly-additive, low-risk changes (a new rule, a
+clarification, a factual fix) may be applied directly. Substantial changes
+(restructuring, new capabilities, changed methodology) and all new-skill
+creation: load `references/skill-authoring.md` first and follow its editing
+and staging rules. If an observation reveals a principle that applies to
+skills generally, propose it for the cross-cutting principles file (see the
+same reference).
+
+## Quick Reference
+
+| Question | Answer |
+|----------|--------|
+| When do I observe? | The whole session, including feedback and reflection phases |
+| How do I log? | Silently, immediately, appended to the end, with the 3-step numbering discipline |
+| When do I surface? | End of session, or earlier if needed |
+| Status line? | Mandatory `**Status:** OPEN` as the first field of every new observation; reviews treat statusless entries as OPEN, never as nonexistent |
+| Citing an observation number? | Only from its literal `### Observation N:` header �?" `grep -n` line numbers are positional metadata, not IDs; sanity-check against the known counter range |
+| Open-source or internal? | Default open-source; the boundary is confidential |
+| Small fix or substantial? | Additive �+' apply directly; restructuring/new skill �+' `references/skill-authoring.md` |
+| Rewriting the log (archival/renumber/status)? | Backup �+' re-read live and merge �+' bounded mutation �+' verify count against live pre-write file �+' confirm own entries survived |
+| Weekly review? | Trigger check at session start; procedure in `references/weekly-review.md` |
+| No filesystem? | Handoff-doc mode �?" `references/environments.md` |
+
+hook: PostToolUse
+ succeeded in 1056ms:
+---
+name: verification-before-completion
+description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
+---
+
+# Verification Before Completion
+
+## Overview
+
+**Core principle:** Evidence before claims, always.
+
+**Violating the letter of this rule is violating the spirit of this rule.**
+
+## The Iron Law
+
+```
+NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
+```
+
+If you haven't run the verification command in this message, you cannot claim it passes.
+
+## The Gate Function
+
+```
+BEFORE claiming any status or expressing satisfaction:
+
+1. IDENTIFY: What command proves this claim?
+2. RUN: Execute the FULL command (fresh, complete)
+3. READ: Full output, check exit code, count failures
+4. VERIFY: Does output confirm the claim?
+   - If NO: State actual status with evidence
+   - If YES: State claim WITH evidence
+5. ONLY THEN: Make the claim
+
+Skip any step = lying, not verifying
+```
+
+## Common Failures
+
+| Claim | Requires | Not Sufficient |
+|-------|----------|----------------|
+| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
+| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
+| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
+| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
+| Regression test works | Red-green cycle verified | Test passes once |
+| Agent completed | VCS diff shows changes | Agent reports "success" |
+| Requirements met | Line-by-line checklist | Tests passing |
+
+## Red Flags - STOP
+
+- Using "should", "probably", "seems to"
+- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!", etc.)
+- About to commit/push/PR without verification
+- Trusting agent success reports
+- Relying on partial verification
+- Thinking "just this once"
+- Tired and wanting work over
+- **ANY wording implying success without having run verification**
+
+## Rationalization Prevention
+
+| Excuse | Reality |
+|--------|---------|
+| "Should work now" | RUN the verification |
+| "I'm confident" | Confidence �%� evidence |
+| "Just this once" | No exceptions |
+| "Linter passed" | Linter �%� compiler |
+| "Agent said success" | Verify independently |
+| "I'm tired" | Exhaustion �%� excuse |
+| "Partial check is enough" | Partial proves nothing |
+| "Different words so rule doesn't apply" | Spirit over letter |
+
+## Key Patterns
+
+**Tests:**
+```
+�o. [Run test command] [See: 34/34 pass] "All tests pass"
+�?O "Should pass now" / "Looks correct"
+```
+
+**Regression tests (TDD Red-Green):**
+```
+�o. Write �+' Run (pass) �+' Revert fix �+' Run (MUST FAIL) �+' Restore �+' Run (pass)
+�?O "I've written a regression test" (without red-green verification)
+```
+
+**Build:**
+```
+�o. [Run build] [See: exit 0] "Build passes"
+�?O "Linter passed" (linter doesn't check compilation)
+```
+
+**Requirements:**
+```
+�o. Re-read plan �+' Create checklist �+' Verify each �+' Report gaps or completion
+�?O "Tests pass, phase complete"
+```
+
+**Agent delegation:**
+```
+�o. Agent reports success �+' Check VCS diff �+' Verify changes �+' Report actual state
+�?O Trust agent report
+```
+
+## When To Apply
+
+**ALWAYS before:**
+- ANY variation of success/completion claims
+- ANY expression of satisfaction
+- ANY positive statement about work state
+- Committing, PR creation, task completion
+- Moving to next task
+- Delegating to agents
+
+**Rule applies to:**
+- Exact phrases
+- Paraphrases and synonyms
+- Implications of success
+- ANY communication suggesting completion/correctness
+
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/gate-check.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/gate-selftest.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'docs/evidence/2026-10-26-f3-data-real-guard.md' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/data-real-guard.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/data-real-guard-selftest.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/README.md' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 731ms:
+   1: /* node tools/gate-check.js <EV> --stage before|final [--no-git]
+   2:    Checks the gate evidence doc: summaries derived from the score lines, the keep rule, the REASON text, prediction order, git state. */
+   3: const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
+   4: const a = process.argv.slice(2);
+   5: const stage = a.indexOf('--stage') >= 0 ? a[a.indexOf('--stage') + 1] : '';
+   6: const noGit = a.includes('--no-git');
+   7: const file = a.find((x, i) => !x.startsWith('--') && a[i - 1] !== '--stage');
+   8: if (!file || !['before', 'final'].includes(stage)) { console.log('usage: gate-check.js <EV> --stage before|final [--no-git]'); process.exit(2); }
+   9: const root = path.join(__dirname, '..');
+  10: const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
+  11: const get = (tag) => {
+  12:   const i = lines.findIndex((l) => l.startsWith(tag));
+  13:   return i < 0 ? null : { i, v: lines[i].slice(tag.length).trim() };
+  14: };
+  15: const bad = [];
+  16: // always, even with --no-git: real data must never be tracked (studio-harness F3)
+  17: const real = require('./data-real-guard.js').trackedReal(root);
+  18: if (!real.ok) bad.push(real.error);
+  19: else if (real.files.length) bad.push('data/real is tracked by git: ' + real.files.join(', '));
+  20: function parse(text) {
+  21:   const m = (re) => { const x = re.exec(text); return x ? +x[1] : NaN; };
+  22:   const s = /split: right feature first (\d+) of (\d+)/.exec(text);
+  23:   const r = { R: s ? +s[1] : NaN, F: s ? +s[2] : NaN, W: m(/wrong card (\d+)/), N: m(/no card where one fits (\d+)/), K: m(/card on a not-a-fit prompt (\d+)/) };
+  24:   return Object.values(r).some(Number.isNaN) ? null : r;
+  25: }
+  26: const derived = (x) => `feature ${x.R} of ${x.F}, wrong ${x.W}, no card ${x.N}, not-a-fit ${x.K}`;
+  27: function side(lineTag, sumTag) {
+  28:   const L = get(lineTag), S = get(sumTag);
+  29:   if (!L) { bad.push('missing ' + lineTag); return null; }
+  30:   const p = parse(L.v);
+  31:   if (!p) { bad.push(lineTag + ' lacks the score numbers'); return null; }
+  32:   if (!S) bad.push('missing ' + sumTag);
+  33:   else if (S.v !== derived(p)) bad.push(`${sumTag} should be "${derived(p)}"`);
+  34:   return { p, L };
+  35: }
+  36: const base = get('BASE-SHA:');
+  37: if (!base || !base.v) bad.push('missing BASE-SHA:');
+  38: const b = side('BEFORE-LINE:', 'BEFORE:');
+  39: const pm = get('PREDICTION-PM:'), lead = get('PREDICTION-LEAD:');
+  40: if (!pm) bad.push('missing PREDICTION-PM:');
+  41: if (!lead) bad.push('missing PREDICTION-LEAD:');
+  42: const outcome = get('OUTCOME:'), reason = get('REASON:');
+  43: let a1 = null;
+  44: const finalOutcome = outcome ? outcome.v : 'pending';
+  45: if (b) {
+  46:   const N0 = b.p.N, inconclusive = N0 < 6;
+  47:   if (inconclusive) {
+  48:     if (!outcome || outcome.v !== 'inconclusive') bad.push('before no-card < 6: OUTCOME must be inconclusive');
+  49:     if (!reason || reason.v !== `before no-card < 6 (${N0})`) bad.push(`REASON must be "before no-card < 6 (${N0})"`);
+  50:   }
+  51:   if (stage === 'final') {
+  52:     if (inconclusive) {
+  53:       if (get('AFTER-LINE:') || get('AFTER:')) bad.push('inconclusive run must have no AFTER-LINE or AFTER:');
+  54:     } else {
+  55:       a1 = side('AFTER-LINE:', 'AFTER:');
+  56:       if (!outcome || !['kept', 'reverted'].includes(outcome.v)) bad.push('OUTCOME must be kept or reverted');
+  57:       const al = get('AFTER-LINE:');
+  58:       if (al && pm && lead && (pm.i > al.i || lead.i > al.i)) bad.push('PREDICTION lines must come before AFTER-LINE');
+  59:       if (a1) {
+  60:         const x = b.p, y = a1.p, why = [];
+  61:         if (!(x.N - y.N >= 2)) why.push(`no-card fall < 2 (${x.N} to ${y.N})`);
+  62:         if (!(y.W <= x.W)) why.push(`wrong card rose (${x.W} to ${y.W})`);
+  63:         if (!(y.K <= x.K)) why.push(`not-a-fit card rose (${x.K} to ${y.K})`);
+  64:         const kept = why.length === 0, want = kept ? 'none' : why.join(' and ');
+  65:         if (outcome && outcome.v !== (kept ? 'kept' : 'reverted')) bad.push(`OUTCOME should be ${kept ? 'kept' : 'reverted'}`);
+  66:         if (!reason || reason.v !== want) bad.push(`REASON should be "${want}"`);
+  67:         const pr = get('PREDICTION:');
+  68:         if (!pr || pr.v !== (kept ? 'held' : 'did not hold')) bad.push(`PREDICTION: should be "${kept ? 'held' : 'did not hold'}"`);
+  69:       }
+  70:     }
+  71:   }
+  72: }
+  73: if (!noGit && base && base.v && !bad.length) {
+  74:   const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8' }).status;
+  75:   const sha = base.v, mf = path.join(root, 'tests/match-frozen.js');
+  76:   const same = run('git', ['diff', '--quiet', sha, 'HEAD', '--', ':(top)fit-finder/engine/fit.js']) === 0;
+  77:   if (finalOutcome === 'kept') {
+  78:     if (same) bad.push('kept but engine/fit.js equals BASE');
+  79:     if (run('node', [mf, '--base', sha, '--allow', 'engine']) !== 0) bad.push('match-frozen --allow engine fails');
+  80:     if (run('node', [mf, '--base', sha]) === 0) bad.push('match-frozen passes without --allow engine');
+  81:   } else {
+  82:     if (!same) bad.push('engine/fit.js differs from BASE but outcome is ' + finalOutcome);
+  83:     if (run('node', [mf, '--base', sha]) !== 0) bad.push('match-frozen --base fails');
+  84:   }
+  85: }
+  86: if (bad.length) { console.log('gate-check FAIL: ' + bad.join('; ')); process.exit(1); }
+  87: const f = (t, x) => `${t} feature ${x.R} of ${x.F} wrong ${x.W} no-card ${x.N} not-a-fit ${x.K}`;
+  88: console.log(`gate-check ok ${stage} ${finalOutcome}; ${f('before', b.p)}` + (a1 ? `; ${f('after', a1.p)}` : ''));
+
+hook: PostToolUse
+ succeeded in 722ms:
+   1: /* node tools/gate-selftest.js : exercises gate-check.js (--no-git, plus one git-mode engine-diff case) and engine-scope.js. Prints gate-selftest ok or the first failure. */
+   2: const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
+   3: const root = path.join(__dirname, '..');
+   4: const gc = path.join(__dirname, 'gate-check.js');
+   5: const es = require('./engine-scope.js');
+   6: const fail = (m) => { console.log('gate-selftest FAIL: ' + m); process.exit(1); };
+   7: const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-selftest-'));
+   8: let n = 0;
+   9: 
+  10: // a score line; `cr` is the "first card right" number (differs from the split number on purpose)
+  11: const line = (R, F, W, N, K, cr) => `first card right: ${cr === undefined ? R + 3 : cr} of ${F + 4} that fit; wrong card ${W} (a); no card where one fits ${N} (b); card on a not-a-fit prompt ${K} (c); fit agreement 12 of 29; score 5; split: right feature first ${R} of ${F}, rightly none 3 (x)`;
+  12: const sum = (tag, R, F, W, N, K) => `${tag} feature ${R} of ${F}, wrong ${W}, no card ${N}, not-a-fit ${K}`;
+  13: function doc(o) {
+  14:   const b = o.b || [17, 29, 2, 8, 0], a = o.a;
+  15:   const L = ['BASE-SHA: ' + (o.sha || 'ae60341'), 'BEFORE-LINE: ' + line(...b), o.beforeSum || sum('BEFORE:', ...b)];
+  16:   if (!o.noPred) { if (!o.pmLate) L.push('PREDICTION-PM: x'); L.push('PREDICTION-LEAD: y'); }
+  17:   if (o.outcome && !a) L.push('OUTCOME: ' + o.outcome);
+  18:   if (o.reason) L.push('REASON: ' + o.reason);
+  19:   if (a) {
+  20:     L.push('AFTER-LINE: ' + line(...a), o.afterSum || sum('AFTER:', ...a));
+  21:     if (o.pmLate) L.push('PREDICTION-PM: x');
+  22:     L.push('OUTCOME: ' + o.outcome, 'REASON: ' + o.reason);
+  23:     if (o.pred) L.push('PREDICTION: ' + o.pred);
+  24:   }
+  25:   return L.join('\n') + '\n';
+  26: }
+  27: function run(stage, o, git) {
+  28:   const f = path.join(dir, 'ev' + (n++) + '.md');
+  29:   fs.writeFileSync(f, doc(o));
+  30:   const r = spawnSync('node', [gc, f, '--stage', stage].concat(git ? [] : ['--no-git']), { encoding: 'utf8' });
+  31:   return git ? r : r.status === 0;
+  32: }
+  33: const ok = (name, stage, o) => { if (!run(stage, o)) fail(name + ' should pass'); };
+  34: const bad = (name, stage, o) => { if (run(stage, o)) fail(name + ' should fail'); };
+  35: 
+  36: ok('before', 'before', {});
+  37: bad('before N0=5 no outcome', 'before', { b: [17, 29, 2, 5, 0] });
+  38: ok('before N0=5 inconclusive', 'before', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
+  39: bad('before N0=5 wrong reason', 'before', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'none' });
+  40: ok('final N0=5 inconclusive', 'final', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
+  41: bad('final N0=5 with after', 'final', { b: [17, 29, 2, 5, 0], a: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
+  42: 
+  43: const B = [17, 29, 2, 8, 0];
+  44: ok('kept', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'held' });
+  45: bad('kept pred did not hold', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'did not hold' });
+  46: ok('reverted N', 'final', { b: B, a: [20, 29, 2, 7, 0], outcome: 'reverted', reason: 'no-card fall < 2 (8 to 7)', pred: 'did not hold' });
+  47: bad('kept when N fell 1', 'final', { b: B, a: [20, 29, 2, 7, 0], outcome: 'kept', reason: 'none', pred: 'held' });
+  48: ok('reverted W', 'final', { b: B, a: [20, 29, 3, 5, 0], outcome: 'reverted', reason: 'wrong card rose (2 to 3)', pred: 'did not hold' });
+  49: ok('reverted K', 'final', { b: B, a: [20, 29, 2, 5, 1], outcome: 'reverted', reason: 'not-a-fit card rose (0 to 1)', pred: 'did not hold' });
+  50: const all = [20, 29, 3, 8, 1], r1 = 'no-card fall < 2 (8 to 8)', r2 = 'wrong card rose (2 to 3)', r3 = 'not-a-fit card rose (0 to 1)';
+  51: ok('all three', 'final', { b: B, a: all, outcome: 'reverted', reason: [r1, r2, r3].join(' and '), pred: 'did not hold' });
+  52: bad('middle missing', 'final', { b: B, a: all, outcome: 'reverted', reason: [r1, r3].join(' and '), pred: 'did not hold' });
+  53: bad('first two swapped', 'final', { b: B, a: all, outcome: 'reverted', reason: [r2, r1, r3].join(' and '), pred: 'did not hold' });
+  54: bad('PM after AFTER-LINE', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'held', pmLate: true });
+  55: bad('summary disagrees', 'final', { b: B, a: [20, 29, 2, 6, 0], afterSum: sum('AFTER:', 21, 29, 2, 6, 0), outcome: 'kept', reason: 'none', pred: 'held' });
+  56: bad('summary from first card right', 'final', { b: B, a: [20, 29, 2, 6, 0, 24], afterSum: sum('AFTER:', 24, 33, 2, 6, 0), outcome: 'kept', reason: 'none', pred: 'held' });
+  57: ok('summary from split with differing first-card number', 'final', { b: B, a: [20, 29, 2, 6, 0, 24], outcome: 'kept', reason: 'none', pred: 'held' });
+  58: 
+  59: // git mode: engine/fit.js at BASE must be compared with HEAD (was a doubled path, always 'same')
+  60: const gr = run('before', { sha: '23757a5' }, true);
+  61: if (!/engine\/fit\.js differs from BASE/.test(gr.stdout)) fail('git mode: BASE with a different engine/fit.js should report that it differs; got: ' + gr.stdout.trim());
+  62: 
+  63: // engine-scope
+  64: const base = fs.readFileSync(path.join(root, 'engine/fit.js'), 'utf8').replace(/\r\n/g, '\n');
+  65: const crlf = (s) => s.replace(/\n/g, '\r\n');
+  66: const once = (s, a, b) => { const i = s.indexOf(a); if (i < 0) fail('anchor missing: ' + a); return s.slice(0, i) + b + s.slice(i + a.length); };
+  67: const opsAt = base.indexOf('    READ: /') + 11;
+  68: const gateAt = base.indexOf('    let fit;\n') + 14;
+  69: const inOps = base.slice(0, opsAt) + '  ' + base.slice(opsAt);              // a changed char inside OPS
+  70: const inGate = base.slice(0, gateAt) + ' ' + base.slice(gateAt);              // a changed char inside the gate block
+  71: const step = /STEP/.test(base) ? once(base, 'STEP', 'STEq') : fail('no STEP label in engine');
+  72: const expect = (name, got, empty) => { if (!!got.length === empty) fail('engine-scope ' + name + (empty ? ' should be empty: ' + got.join('; ') : ' should fail')); };
+  73: expect('same', es.check(base, base), true);
+  74: expect('ops change', es.check(base, inOps), true);
+  75: expect('gate change', es.check(base, inGate), true);
+  76: expect('STEP change', es.check(base, step), false);
+  77: const km = base.match(/^\s{4}([A-Z]+):/m)[1];
+  78: expect('deleted key', es.check(base, once(base, '    ' + km + ':', '    ' + km.toLowerCase() + 'x:')), false);
+  79: expect('Date in OPS', es.check(base, base.slice(0, opsAt) + '/*Date.now()*/' + base.slice(opsAt)), false);
+  80: expect('crlf vs lf', es.check(crlf(base), base), true);
+  81: const mixed = (s) => s.split('\n').map((l, i, all) => i % 2 && i < all.length - 1 ? l + '\r' : l).join('\n');
+  82: expect('lf vs mixed ops change', es.check(base, mixed(inOps)), true);
+  83: expect('mixed STEP', es.check(base, mixed(step)), false);
+  84: console.log('gate-selftest ok');
+
+hook: PostToolUse
+ succeeded in 700ms:
+   1: # F3 (Fit Finder half): the done check fails when data/real is tracked
+   2: 
+   3: studio-harness F3 (premortem 7): "the Fit Finder done check fails if data/real is git-tracked". Branch `harness/f3-data-real-guard`, based on `prompt-coach` fb26061. Run 2026-10-26 ~01:05Z on Ian's PC.
+   4: 
+   5: ## What changed
+   6: 
+   7: - `fit-finder/tools/data-real-guard.js`: runs `git ls-files -- data/real` from `fit-finder/`; exit 1 if it lists anything, and exit 1 if git itself fails (fails closed). Lists paths only, never reads the files.
+   8: - `fit-finder/tools/gate-check.js` (the Fit Finder done/gate check) calls it on every run, even with `--no-git`, and adds `data/real is tracked by git: <paths>` to its FAIL reasons.
+   9: - `fit-finder/tools/data-real-guard-selftest.js`: test, written first. A throwaway git repo shaped like workiva gets copies of the real `gate-check.js` and `data-real-guard.js` and one fake file `fit-finder/data/real/fake.jsonl`. The real `data/real` is never opened.
+  10: - `fit-finder/tools/README.md`: the gate-check row names the new failure; one row for the guard and its selftest.
+  11: 
+  12: Choice logged: Fit Finder has no GOAL.md done line, so "the done check" is taken to be `tools/gate-check.js`, the only gate check script, and the guard is also runnable alone.
+  13: 
+  14: ## Test run (commands from `fit-finder/`)
+  15: 
+  16: Red 1, guard not written: `node tools/data-real-guard-selftest.js` -> exit 1, `ENOENT ... copyfile ...tools\data-real-guard.js`.
+  17: 
+  18: Red 2, guard written but not called by gate-check (the join):
+  19: ```
+  20: data-real-guard-selftest FAIL: tracked gate: want exit 1 matching /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/, got 0: gate-check ok before pending; before feature 17 of 29 wrong 2 no-card 8 not-a-fit 0
+  21: exit 1
+  22: ```
+  23: 
+  24: Green, after the call in gate-check:
+  25: ```
+  26: ## data-real-guard-selftest
+  27: data-real-guard-selftest ok (7 checks)
+  28: exit 0
+  29: ## gate-selftest
+  30: gate-selftest ok
+  31: exit 0
+  32: ## data-real-guard on this checkout
+  33: data-real-guard ok
+  34: exit 0
+  35: ```
+  36: 
+  37: The 7 checks: untracked file on disk passes (guard, gate); `git add -f` of the fake file fails (guard and gate, each naming the path; `trackedReal` lists exactly it); `git rm --cached` passes again; outside any repo the guard fails closed (`git ls-files failed`). On this checkout nothing under `data/real` is tracked.
+
+hook: PostToolUse
+ succeeded in 701ms:
+   1: /* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
+   2:    Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed). */
+   3: const { spawnSync } = require('child_process');
+   4: function trackedReal(dir) {
+   5:   const r = spawnSync('git', ['ls-files', '--', 'data/real'], { cwd: dir, encoding: 'utf8' });
+   6:   if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
+   7:   return { ok: true, files: r.stdout.split(/\r?\n/).filter(Boolean) };
+   8: }
+   9: module.exports = { trackedReal };
+  10: if (require.main === module) {
+  11:   const t = trackedReal(process.cwd());
+  12:   if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
+  13:   if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
+  14:   console.log('data-real-guard ok');
+  15: }
+
+hook: PostToolUse
+ succeeded in 749ms:
+   1: /* node tools/data-real-guard-selftest.js : exercises data-real-guard.js and its call from gate-check.js in a throwaway git repo
+   2:    (fake files only; the real data/real is never read). Prints data-real-guard-selftest ok or the first failure. */
+   3: const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
+   4: const fail = (m) => { console.log('data-real-guard-selftest FAIL: ' + m); process.exit(1); };
+   5: const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-real-guard-'));
+   6: const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
+   7: 
+   8: // throwaway repo shaped like workiva: <repo>/fit-finder/tools/{gate-check,data-real-guard}.js copied from this checkout
+   9: const repo = path.join(tmp, 'repo'), ff = path.join(repo, 'fit-finder');
+  10: fs.mkdirSync(path.join(ff, 'tools'), { recursive: true });
+  11: fs.mkdirSync(path.join(ff, 'data', 'real'), { recursive: true });
+  12: for (const f of ['gate-check.js', 'data-real-guard.js']) fs.copyFileSync(path.join(__dirname, f), path.join(ff, 'tools', f));
+  13: if (git(repo, 'init', '-q').status !== 0) fail('git init');
+  14: fs.writeFileSync(path.join(ff, 'data', 'real', 'fake.jsonl'), '{"fake":"not real data"}\n');
+  15: fs.writeFileSync(path.join(ff, 'README.md'), 'x\n');
+  16: git(repo, 'add', 'fit-finder/README.md');
+  17: 
+  18: // a valid before-stage evidence doc (no-card 8, so no OUTCOME needed)
+  19: const line = 'first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits 8 (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)';
+  20: const ev = path.join(tmp, 'ev.md');
+  21: fs.writeFileSync(ev, ['BASE-SHA: ae60341', 'BEFORE-LINE: ' + line, 'BEFORE: feature 17 of 29, wrong 2, no card 8, not-a-fit 0', 'PREDICTION-PM: x', 'PREDICTION-LEAD: y'].join('\n') + '\n');
+  22: const gate = () => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8' });
+  23: const guard = (cwd) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp } });
+  24: let n = 0;
+  25: const expect = (name, r, code, re) => {
+  26:   n++;
+  27:   if (r.status !== code || !re.test(r.stdout)) fail(`${name}: want exit ${code} matching ${re}, got ${r.status}: ${(r.stdout + r.stderr).trim()}`);
+  28: };
+  29: 
+  30: // 1-2. control: data/real exists on disk but is untracked, so guard and done check pass
+  31: expect('untracked guard', guard(ff), 0, /^data-real-guard ok/);
+  32: expect('untracked gate', gate(), 0, /^gate-check ok before/);
+  33: 
+  34: // 3-5. tracked: git add a file under data/real, and both fail naming it
+  35: git(repo, 'add', '-f', 'fit-finder/data/real/fake.jsonl');
+  36: expect('tracked guard', guard(ff), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
+  37: expect('tracked gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
+  38: const { trackedReal } = require(path.join(ff, 'tools', 'data-real-guard.js'));
+  39: const t = trackedReal(ff);
+  40: if (!t.ok || t.files.join() !== 'data/real/fake.jsonl') fail('trackedReal lists ' + JSON.stringify(t));
+  41: n++;
+  42: 
+  43: // 6. untrack again: passes again
+  44: git(repo, 'rm', '-q', '--cached', 'fit-finder/data/real/fake.jsonl');
+  45: expect('untracked again gate', gate(), 0, /^gate-check ok before/);
+  46: 
+  47: // 7. fails closed outside a git repo (git ls-files errors)
+  48: const bare = path.join(tmp, 'not-a-repo');
+  49: fs.mkdirSync(bare);
+  50: expect('no repo guard', guard(bare), 1, /data-real-guard FAIL: git ls-files failed/);
+  51: 
+  52: fs.rmSync(tmp, { recursive: true, force: true });
+  53: console.log(`data-real-guard-selftest ok (${n} checks)`);
+
+hook: PostToolUse
+ succeeded in 940ms:
+   1: # fit-finder/tools
+   2: 
+   3: Small scripts for the BCA run. Run them from `fit-finder/` (paths are relative to where you run them). Every script exits non-zero on a problem. `node tools/selftest.js` exercises all of them on `tools/fixtures/` and prints `selftest ok`.
+   4: 
+   5: `L` below is the run ledger `<repo root>/.ledger/2026-10-22-fit-finder-bca` (git-ignored; the env var `FF_LEDGER` overrides it, used by the self-test only).
+   6: 
+   7: | Script | Arguments | Prints | Exit |
+   8: |---|---|---|---|
+   9: | `check-set.js` | `<prompts> <gold\|-> <catalogue> [--not-range LO HI]` | `rows N, per area FR a GRC b SUS c GEN d, gold M, not K, unknown cards U` | 1 on 0 rows, a row lacking string `id`/`task`, a repeated id, an `area` not in FR/GRC/SUS/GEN. With gold: a missing or extra gold id, `fit` not good/partial/not, `cards` not an array, a `not` row with cards, a card id not in the catalogue; with `--not-range`, K outside LO..HI |
+  10: | `nearcopy.js` | `<fresh> <real dir> [--catalogue <catalogue>]` | `files read F, rows read R, windows W`, `control: hit`, then `hits: none` or `hits: <fresh ids>`. Never prints text | 1 if F, R or W is 0, the positive control misses, or any hit. 5-word windows over every string value of every real row; with `--catalogue` a fresh row also hits on a window shared with any card's `try` |
+  11: | `agree.js` | `<frozen> <final>` | `N <n> D <d> agreement <pct> PASS\|FAIL` | 1 if an id set differs, a differing row (fit or sorted cards) lacks `"by":"ian"`, an unchanged row has it, or (N-D)/N < 0.845 (N=40: D <= 6) |
+  12: | `card-view.js` | `<catalogue> <out>` | `cards N` | writes `{"useCases":[...]}` with every card minus `match` and `ops` (`try` kept) |
+  13: | `label-sheet.js` | `<draft> <card-view> <out>`; or `--verify <sheet> <draft> <catalogue>` | `label-sheet rows N`; or `label-sheet ok` | 1 on bad input; `--verify` rebuilds the sheet from the draft and catalogue and needs a byte-for-byte match |
+  14: | `label-handoff.js` | `[--check] <looks file> <sheet> <ian batch json> <catalogue> <out frozen> <out gold>` | `label-handoff ok rows N changed D`, or `STOP: <reason>` | 3 on any `STOP`. `--check` recomputes both outputs in memory and exits 1 unless they equal the files byte for byte |
+  15: | `score-once.js` | `<name> <prompts> <gold> [--scorer <path>]` | the scorer's stdout (from `L/score-<name>.out` on a repeat) | the scorer's status. 3 with `STOP: unknown outcome` if `L/score-<name>.started` exists without `.out` |
+  16: | `keep-check.js` | `<EV>` | `keep-check ok <outcome>` | 1 if the rule, the written REASON or the git state disagree |
+  17: | `ops-check.js` | `<base sha>` | `ops-check ok <n> cards changed` | 1 on any violation |
+  18: | `diag-nocard.js`, `diag-selftest.js` | `[--engine <path>]` (self-test only); selftest: none (needs `FF_LEDGER`) | `diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K`; selftest `diag-selftest ok` | 1 with `INVALID: ...` if tune wrong > 4, tune not-a-fit > BASE_K or half A wrong > 0; 2 on bad input. Reads only the tune set and half A |
+  19: | `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees, or (always, even with `--no-git`) git tracks anything under `data/real` |
+  20: | `data-real-guard.js`, `data-real-guard-selftest.js` | none | `data-real-guard ok` / `data-real-guard FAIL: data/real is tracked by git: <paths>`; `data-real-guard-selftest ok (7 checks)` | 1 if `git ls-files -- data/real` lists anything or itself fails; lists paths only, never reads the files. The selftest uses a throwaway repo with a fake file |
+  21: | `engine-scope.js`, `gate-selftest.js` | `--git <sha>` or `--files <base> <new>`; selftest: none | `engine-scope ok` / `engine-scope FAIL: <problems>`; `gate-selftest ok` | 1 if `engine/fit.js` differs from the base outside the `OPS` block and the `let fit;`..`return { fit,` gate block (line endings ignored), an OPS key changed, or an added line has Date/performance/location/http/fetch/require(/process |
+  22: | `selftest.js` | none | `selftest ok` or `selftest FAIL: ...` | 1 on the first failure |
+  23: 
+  24: ## Details
+  25: 
+  26: **label-handoff.** The PICK is ONE line of space-separated `<id>=<label>` tokens after a `PICK` marker (on the same line, or the next non-empty line). Labels: a catalogue card id, `none`, `not`. Every sheet id (`### <id> | <area>` headings) appears exactly once. The batch needs a non-empty `words`, a boolean `accepted`, `sheetSha256` equal to the sheet's sha256 (and the sheet must match `L/label-sheet.sha256` if that exists), `changes[].id` in the sheet with a legal `label`, and empty `changes` when `accepted` is true. Frozen rows: `{"id","fit","cards","by":"pm"}` (card id: `good` + `[id]`; `none`: `good` + `[]`; `not`: `not` + `[]`). Gold = frozen with the changes applied and `"by":"ian"` on exactly the changed rows (a change equal to the PM label is ignored).
+  27: 
+  28: **score-once.** Runs `node tests/synth-score.js <prompts> <gold>` from `fit-finder/` (or `--scorer`, self-test only) at most once per `<name>`. First call: writes `.started`, runs, writes `.out` atomically (first line `STATUS <n>`, then stdout), prints stdout, exits with the scorer's status. Later calls print the saved stdout and exit with the saved status without running anything. Fresh/holdout/blind lines are copied only from `L/score-<name>.out`.
+  29: 
+  30: **keep-check.** Reads `BEFORE-LINE`, `AFTER-LINE`, `OUTCOME`, `REASON` from the evidence doc; R = number after `right feature first `, S = number after `score `. Kept iff R1 >= R0 + 1 and S1 <= S0. REASON must be `none` (kept) or `R gain < 1 (R0 to R1)` / `S rose (S0 to S1)` / `R gain < 1 and S rose (R0 to R1; S0 to S1)`. Git check against the commit whose subject starts `task 11:`: reverted needs `node tests/match-frozen.js --base <sha>` to pass; kept needs it to pass with `--allow ops` and fail without.
+  31: 
+  32: **ops-check.** Compares `data/catalogue.json` at `<base sha>` with the working tree: same cards in the same order, every field except `ops` equal, each `ops` starts with the old `ops` (append only), every added value is in `AI_OPS` (`engine/fit.js`, the list `tests/catalogue.test.js` checks), and at least one card changed.
+
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+codex
+About 11 minutes left. The guard runs before the stage, outcome, and `--no-git` branches, and a guard failure stays in the final failure list. The new selftest exercises the actual gate script in a fake repo. I’ll now check whether Git can select the wrong index or miss tracked paths.
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath "C:/Users/teasp/.codex/plugins/cache/superpowers-marketplace/superpowers/7.0.1/skills/using-superpowers/references/codex-tools.md"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node fit-finder/tools/data-real-guard-selftest.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git log -1 --format=fuller d007e0b' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ exited 1 in 478ms:
+node:fs:3600
+  return binding.mkdtemp(prefix, options.encoding);
+                 ^
+
+Error: EPERM: operation not permitted, mkdtemp 'C:\Users\teasp\AppData\Local\Temp\data-real-guard-XXXXXX'
+    at Object.mkdtempSync (node:fs:3600:18)
+    at Object.<anonymous> (C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard\fit-finder\tools\data-real-guard-selftest.js:5:16)
+    at Module._compile (node:internal/modules/cjs/loader:1934:14)
+    at Object..js (node:internal/modules/cjs/loader:2074:10)
+    at Module.load (node:internal/modules/cjs/loader:1656:32)
+    at Module._load (node:internal/modules/cjs/loader:1448:12)
+    at wrapModuleLoad (node:internal/modules/cjs/loader:261:19)
+    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
+    at node:internal/main/run_main_module:33:47 {
+  errno: -4048,
+  code: 'EPERM',
+  syscall: 'mkdtemp',
+  path: 'C:\\Users\\teasp\\AppData\\Local\\Temp\\data-real-guard-XXXXXX'
+}
+
+Node.js v26.5.0
+
+hook: PostToolUse
+ succeeded in 793ms:
+## Subagent dispatch requires multi-agent support
+
+Add to your Codex config (`~/.codex/config.toml`):
+
+```toml
+[features]
+multi_agent = true
+```
+
+This enables the multi-agent tools that skills like
+`dispatching-parallel-agents` and `subagent-driven-development` use.
+Which tools you get depends on the multi-agent version your model
+preset selects (current presets run V2; older ones run V1). Trust your
+actual tool list over any table �?" including this one �?" when they
+disagree.
+
+- **Spawning:** give children a clean context with
+  `spawn_agent {fork_turns: "none"}`; the default `"all"` copies your
+  entire transcript into the child. On Codex 0.145+, role files under
+  `~/.codex/agents/` attach to isolated forks via `agent_type`.
+  Full-history forks accept `model` and `reasoning_effort` overrides
+  (only `agent_type` is refused there) �?" isolated forks are the SDD
+  default for context hygiene, not because overrides require them.
+- **Fix rounds:** resume the implementer with `followup_task` �?" it
+  delivers your message, triggers a turn, and transparently reloads a
+  child the harness evicted. Never dispatch a fresh implementer on the
+  theory that a spawned agent cannot be messaged again; on V2 it
+  always can.
+- **Lifecycle:** V2 has no `close_agent`. Finished children are
+  evicted automatically when slots are needed; leaving them unclosed
+  costs nothing. Only V1 sessions have `close_agent` �?" there, close
+  reviewers when their review returns, and close each implementer
+  after its task's review passes.
+- **Model names:** never copy a model name from a skill, table, or old
+  session into `spawn_agent` without checking it against your current
+  spawn allowlist �?" V2 accepts only V2-capable presets and hard-errors
+  on the rest.
+
+## Waiting on children
+
+`wait_agent` is an event subscription, not a poll: a long wait wakes
+the moment a child produces mailbox activity, with the same latency as
+a short one. Short-timeout polling buys nothing and costs a tool call �?"
+and a context rebill �?" per poll. In measured sessions, roughly
+two-thirds of all wait calls were short polls that timed out.
+
+- While you still have local work, do not wait at all. A completed
+  child's final answer is pushed into your mailbox and arrives with
+  your next turn.
+- When you are genuinely idle with children outstanding, wait in
+  bounded stretches: `wait_agent` with `timeout_ms` 300000-600000
+  (5-10 minutes). After each stretch �?" wake or timeout �?" post one
+  status line, run `list_agents`, and chase any child that finished
+  without reporting. Never stack polls shorter than five minutes; the
+  event subscription wakes a bounded stretch just as fast as a short
+  one.
+- Completion mail cannot wake an idle controller (it is delivered
+  without triggering a turn); covering that idle window is
+  `wait_agent`'s only job. A stretch that times out with no activity
+  is your cue to reconcile, not to shorten the next stretch.
+
+## Model routing on spawns
+
+Every `spawn_agent` you issue �?" including when you are yourself a
+spawned child running a fan-out �?" sets `model` AND `reasoning_effort`
+explicitly, per the Model Selection rules of the skill you are
+executing. Setting `model` alone is a trap: the child's effort
+silently resets to that model's default, not to yours.
+
+Ask your human partner to add a machine-level backstop to
+`~/.codex/config.toml` so any spawn that slips through still routes to
+a deliberate tier instead of silently inheriting the session's most
+expensive model:
+
+```toml
+[agents]
+default_subagent_model = "<a mid-tier model from your spawn allowlist>"
+default_subagent_reasoning_effort = "medium"
+```
+
+## Environment Detection
+
+Skills that create worktrees or finish branches should detect their
+environment with read-only git commands before proceeding:
+
+```bash
+GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
+GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
+BRANCH=$(git branch --show-current)
+```
+
+- `GIT_DIR != GIT_COMMON` �+' already in a linked worktree (skip creation)
+- `BRANCH` empty �+' detached HEAD (cannot branch/push/PR from sandbox)
+
+See `using-git-worktrees` Step 0 and `finishing-a-development-branch`
+Step 1 for how each skill uses these signals.
+
+## Codex App Finishing
+
+When the sandbox blocks branch/push operations (detached HEAD in an
+externally managed worktree), the agent commits all work and informs
+the user to use the App's native controls:
+
+- **"Create branch"** �?" names the branch, then commit/push/PR via App UI
+- **"Hand off to local"** �?" transfers work to the user's local checkout
+
+The agent can still run tests, stage files, and output suggested branch
+names, commit messages, and PR descriptions for the user to copy.
+
+hook: PostToolUse
+ succeeded in 844ms:
+commit d007e0b3dd547084be13d9330b60176632432eac
+Author:     Ian <iansomintac.contact@gmail.com>
+AuthorDate: Sun Oct 25 18:07:43 2026 -0700
+Commit:     Ian <iansomintac.contact@gmail.com>
+CommitDate: Sun Oct 25 18:07:43 2026 -0700
+
+    fit-finder: gate-check fails when data/real is tracked by git (studio-harness F3)
+    
+    New tools/data-real-guard.js (git ls-files -- data/real; fails closed),
+    called by gate-check.js on every run. Test first:
+    tools/data-real-guard-selftest.js in a throwaway repo with a fake file
+    (7 checks). Evidence: docs/evidence/2026-10-26-f3-data-real-guard.md.
+    
+    Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
+    Claude-Session: https://claude.ai/code/session_01FxbuZBzRD5fEEEsCr7ohwC
+
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+codex
+About 8 minutes left. The selftest was blocked at `mkdtemp` with EPERM, before it created a fixture. I’ll distinguish fresh in-memory checks from code inspection and the recorded red/green output. I also won’t run `gate-selftest.js`: it reads files outside your allowlist.
+hook: PreToolUse
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
+const fs = require('fs'), vm = require('vm'), path = require('path');
+const gateSource = fs.readFileSync('fit-finder/tools/gate-check.js', 'utf8');
+const guardSource = fs.readFileSync('fit-finder/tools/data-real-guard.js', 'utf8');
+const line = n => "'`first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits ${n} (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)`;
+function doc(stage, outcome) {
+  const n = outcome === '"'inconclusive' ? 5 : 8;
+  let s = "'`BASE-SHA: ae60341'"\\nBEFORE-LINE: "'${line(n)}'"\\nBEFORE: feature 17 of 29, wrong 2, no card "'${n}, not-a-fit 0'"\\nPREDICTION-PM: x\\nPREDICTION-LEAD: y\\n"'`;
+  if (outcome === '"'inconclusive') s += 'OUTCOME: inconclusive\\nREASON: before no-card < 6 (5)\\n';
+  else if (stage === 'final') {
+    const after = outcome === 'kept' ? 6 : 7;
+    s += "'`AFTER-LINE: ${line(after)}'"\\nAFTER: feature 17 of 29, wrong 2, no card "'${after}, not-a-fit 0'"\\nOUTCOME: "'${outcome}'"\\nREASON: "'${outcome === '"'kept' ? 'none' : 'no-card fall < 2 (8 to 7)'}\\nPREDICTION: "'${outcome === '"'kept' ? 'held' : 'did not hold'}\\n"'`;
+  }
+  return s;
+}
+function run(stage, outcome, noGit, result, cwdLabel) {
+  const calls = [], output = [], exit = {};
+  const spawnSync = (cmd, args, options) => { calls.push({cmd,args,cwd:options.cwd}); return result; };
+  const helper = {exports:{}};
+  vm.runInNewContext(guardSource,{require:n=>{if(n==='"'child_process')return {spawnSync};throw Error(n)},module:helper,console});
+  const root = path.resolve('fit-finder/tools');
+  let code=0;
+  try {vm.runInNewContext(gateSource, {
+    __dirname:root, console:{log:s=>output.push(s)},
+    process:{argv:['node','gate-check.js','memory-evidence','--stage',stage,...(noGit?['--no-git']:[])],cwd:()=>cwdLabel,exit:n=>{code=n;throw exit}},
+    require:n=>{if(n==='fs')return {readFileSync:()=>doc(stage,outcome)};if(n==='path')return path;if(n==='child_process')return {spawnSync};if(n==='./data-real-guard.js')return helper.exports;throw Error(n)}
+  });} catch(e) {if(e"'!==exit)throw e;}
+  return {code,output:output.join('"'\\n'),calls};
+}
+let count=0;
+for(const [stage,outcome] of [['before','pending'],['before','inconclusive'],['final','inconclusive'],['final','kept'],['final','reverted']]) {
+  for(const noGit of [true,false]) {
+    for(const cwd of ['C:/elsewhere','C:/space and [odd]/subfolder']) {
+      const r=run(stage,outcome,noGit,{status:0,stdout:'data/real/sub/odd name.jsonl\\n',stderr:''},cwd);
+      if(r.code"'!==1 || !r.output.includes('"'data/real is tracked by git:') || r.calls.length"'!==1 || r.calls[0].cwd!==path.resolve('"'fit-finder'))throw Error(JSON.stringify(r));
+      count++;
+    }
+  }
+}
+console.log("'`IN-MEMORY: ${count} tracked gate cases exit 1 across stage/outcome/no-git/caller-cwd; only guard called`);
+for(const [name,result] of [['"'not-repo',{status:128,stdout:'',stderr:'fatal: not a git repository'}],['missing-git',{status:null,stdout:null,stderr:null,error:{message:'spawnSync git ENOENT'}}],['other-failure',{status:1,stdout:'',stderr:'bad index'}],['signal',{status:null,stdout:'',stderr:''}],['buffer-overflow',{status:null,stdout:'x',error:{message:'ENOBUFS'}}]]) {
+  const r=run('before','pending',true,result,'C:/elsewhere');
+  if(r.code"'!==1 || !r.output.includes('"'git ls-files failed'))throw Error(JSON.stringify(r));
+  console.log("'`IN-MEMORY: ${name} -> gate exit ${r.code}`);
+}
+const control=run('"'before','pending',true,{status:0,stdout:'',stderr:''},'C:/elsewhere');
+if(control.code"'!==0)throw Error(JSON.stringify(control));
+console.log('"'IN-MEMORY: clean-index control -> gate exit 0');
+'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 636ms:
+IN-MEMORY: 20 tracked gate cases exit 1 across stage/outcome/no-git/caller-cwd; only guard called
+IN-MEMORY: not-repo -> gate exit 1
+IN-MEMORY: missing-git -> gate exit 1
+IN-MEMORY: other-failure -> gate exit 1
+IN-MEMORY: signal -> gate exit 1
+IN-MEMORY: buffer-overflow -> gate exit 1
+IN-MEMORY: clean-index control -> gate exit 0
+
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only prompt-coach...HEAD -- fit-finder/tools/data-real-guard.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
+const {spawnSync}=require('child_process'), path=require('path'),os=require('os');
+const cwd=path.resolve('fit-finder');
+const allowed=['ls-files','--','tools/data-real-guard.js'];
+for(const [name,extra] of [['normal',{}],['alternate missing index',{GIT_INDEX_FILE:path.join(os.tmpdir(),"'`f3-judge-absent-index-${process.pid}-${Date.now()}`)}],['"'redirected worktree',{GIT_WORK_TREE:os.tmpdir()}]]){
+ const r=spawnSync('git',allowed,{cwd,encoding:'utf8',env:{...process.env,...extra}});
+ console.log(JSON.stringify({name,status:r.status,allowedToolPaths:r.stdout.trim(),error:r.stderr.trim()}));
+}
+'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only prompt-coach...HEAD -- Fit-Finder/tools/data-real-guard.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only prompt-coach...HEAD -- fit-finder/TOOLS/data-real-guard.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 319ms:
+fit-finder/tools/data-real-guard.js
+
+hook: PostToolUse
+ succeeded in 338ms:
+hook: PostToolUse
+ succeeded in 344ms:
+hook: PostToolUse
+ succeeded in 872ms:
+{"name":"normal","status":0,"allowedToolPaths":"tools/data-real-guard.js","error":""}
+{"name":"alternate missing index","status":0,"allowedToolPaths":"","error":""}
+{"name":"redirected worktree","status":0,"allowedToolPaths":"","error":""}
+
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+codex
+About 5 minutes left. I found a potential bypass through inherited Git environment variables: using an allowed tracked tool file as a safe proxy, both an alternate missing `GIT_INDEX_FILE` and a redirected `GIT_WORK_TREE` made Git return success with no paths. The guard inherits those variables. I’m checking Windows path matching before assigning severity.
+hook: PreToolUse
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
+const {spawnSync}=require('child_process'), path=require('path');
+const root=process.cwd();
+const tests=[
+ ['exact',path.join(root,'fit-finder'),['ls-files','--','tools/data-real-guard.js']],
+ ['uppercase file pathspec',path.join(root,'fit-finder'),['ls-files','--','tools/DATA-REAL-GUARD.js']],
+ ['uppercase pathspec ignorecase true',path.join(root,'fit-finder'),['-c','core.ignorecase=true','ls-files','--','tools/DATA-REAL-GUARD.js']],
+ ['uppercase cwd',path.join(root,'FIT-FINDER'),['ls-files','--','tools/data-real-guard.js']],
+ ['uppercase tools cwd',path.join(root,'fit-finder','TOOLS'),['ls-files','--','data-real-guard.js']],
+ ['icase pathspec',path.join(root,'fit-finder'),['ls-files','--',':(icase)tools/DATA-REAL-GUARD.js']]
+];
+for(const [name,cwd,args] of tests){const r=spawnSync('git',args,{cwd,encoding:'utf8'});console.log(JSON.stringify({name,status:r.status,allowedToolPaths:r.stdout,error:r.stderr}));}
+'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 782ms:
+{"name":"exact","status":0,"allowedToolPaths":"tools/data-real-guard.js\n","error":""}
+{"name":"uppercase file pathspec","status":0,"allowedToolPaths":"","error":""}
+{"name":"uppercase pathspec ignorecase true","status":0,"allowedToolPaths":"","error":""}
+{"name":"uppercase cwd","status":0,"allowedToolPaths":"tools/data-real-guard.js\n","error":""}
+{"name":"uppercase tools cwd","status":0,"allowedToolPaths":"data-real-guard.js\n","error":""}
+{"name":"icase pathspec","status":0,"allowedToolPaths":"tools/data-real-guard.js\n","error":""}
+
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PreToolUse
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
+const fs=require('fs'),vm=require('vm'),path=require('path');
+const source=fs.readFileSync('fit-finder/tools/data-real-guard.js','utf8');
+let output='';const calls=[];const m={exports:{}};
+vm.runInNewContext(source,{module:m,require:n=>({spawnSync:(cmd,args,opts)=>{calls.push({cmd,args,opts});return {status:0,stdout:output,stderr:''};}})});
+for(const [name,text] of [
+ ['spaces','data/real/fake file.jsonl\\n'],
+ ['subfolder','data/real/sub/deep/fake.jsonl\\n'],
+ ['quoted unusual name','\"data/real/a\\\\nb.jsonl\"\\n'],
+ ['tracked symlink path itself','data/real\\n'],
+ ['tracked gitlink at data/real','data/real\\n'],
+ ['tracked gitlink under data/real','data/real/submodule\\n'],
+ ['empty index','']
+]){output=text;const r=m.exports.trackedReal('C:/fixture with spaces/fit-finder');console.log(JSON.stringify({injectedGitResult:name,ok:r.ok,count:r.files.length,wouldReject:r.files.length>0}));}
+console.log('Exact spawn contract: '+JSON.stringify(calls[0]));
+'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 578ms:
+{"injectedGitResult":"spaces","ok":true,"count":1,"wouldReject":true}
+{"injectedGitResult":"subfolder","ok":true,"count":1,"wouldReject":true}
+{"injectedGitResult":"quoted unusual name","ok":true,"count":1,"wouldReject":true}
+{"injectedGitResult":"tracked symlink path itself","ok":true,"count":1,"wouldReject":true}
+{"injectedGitResult":"tracked gitlink at data/real","ok":true,"count":1,"wouldReject":true}
+{"injectedGitResult":"tracked gitlink under data/real","ok":true,"count":1,"wouldReject":true}
+{"injectedGitResult":"empty index","ok":true,"count":0,"wouldReject":false}
+Exact spawn contract: {"cmd":"git","args":["ls-files","--","data/real"],"opts":{"cwd":"C:/fixture with spaces/fit-finder","encoding":"utf8"}}
+
+hook: PostToolUse
+hook: PostToolUse Completed
+codex
+Two must-fixes prevent an unconditional pass.
+
+1. **Bind the check to the intended repository and index.** [data-real-guard.js:5](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/data-real-guard.js:5) inherits Git’s environment. Using only an allowed tracked tool file as a safe proxy, I measured:
+   - Normal environment: Git listed the tracked file.
+   - `GIT_INDEX_FILE` pointing to a nonexistent index: exit **0**, empty output.
+   - `GIT_WORK_TREE` redirected elsewhere: exit **0**, empty output.
+
+   The guard accepts both empty results. With `--no-git`, that permits otherwise-valid evidence to pass. Inherited Git variables can be an honest mistake; deliberately exploiting them also has a small fix. Clear repository/index overrides and anchor the intended repository. Apply the same isolation to the selftest’s Git commands, which currently inherit these variables too.
+
+2. **Handle Windows case variants.** The literal `data/real` pathspec is case-sensitive, even with `core.ignorecase=true`. I verified that behavior against allowed tool paths: exact spelling listed the tracked file; changed case returned exit **0** with nothing. An index entry under `data/REAL/...` can therefore escape this check while referring to the same Windows directory. Use case-insensitive matching on Windows and add a fixture case.
+
+The join itself is sound. At [gate-check.js:17](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/gate-check.js:17), guard failures enter `bad` before stage/outcome checks and before the `--no-git` condition. Nothing subsequently clears them. **Whenever the selected Git command returns paths or errors, the gate fails in every valid mode.**
+
+Fresh in-memory execution of the actual allowed source confirmed:
+
+- **20 tracked-output cases** exited 1 across before/final, pending/inconclusive/kept/reverted, both Git modes, and different caller directories.
+- Injected not-a-repository, missing-Git, other failure, signal, and buffer-overflow results each made the gate exit 1.
+- An empty successful result allowed the valid control to exit 0.
+
+The new selftest is **not vacuous under a normal environment**. It copies the actual gate and helper into a throwaway repo, establishes a passing control, stages a fake file, requires the gate to fail with that filename, then unstages it and requires another pass. Removing the join would fail its tracked-gate assertion. The outside-repository case tests only the helper.
+
+Test-first chronology is supported by the [recorded red/green output](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/docs/evidence/2026-10-26-f3-data-real-guard.md:16), especially the recorded failure with the join absent. One final commit cannot independently establish that chronology.
+
+Other bypass results and limits:
+
+| Attempt | Result |
+|---|---|
+| Caller cwd; paths containing spaces | In-memory checks rejected tracked output; gate anchors cwd to its script location. |
+| Staged but uncommitted file | Covered by the fixture’s code and recorded run; no commit is made. |
+| Subfolders; spaces or unusual filenames | Injected outputs were rejected; parsing needs only one nonempty line. |
+| Uppercase caller cwd | Actual safe Git probe still found the tracked tool file. |
+| Tracked `data/real` symlink or submodule | Inspection indicates detection: the symlink/gitlink path itself is listed. Injected outputs were rejected. |
+| Unregistered nested repo | Its independently tracked contents are outside the outer index. A nested repo at `fit-finder/` can also shadow the intended outer index; repository anchoring should address that. Not dynamically tested. |
+| Sparse checkout / skip-worktree | No filesystem-existence filter is present; these should remain visible through the index. Not dynamically tested. |
+| Another `data/real` elsewhere in the repo | Outside this check’s specified Fit Finder scope. |
+| Early exits and check order | Invalid arguments exit 2; unreadable evidence exits nonzero. Neither creates a successful bypass. Guard failures skip the later Git checks and reach exit 1. |
+
+The selftest run was blocked at `mkdtemp` with **EPERM**, before creating its fixture. I relied on code inspection and the recorded output for its filesystem behavior. I did not run `gate-selftest.js`, because it reads files outside your allowlist. No customer-data paths were opened or listed, and no files were edited.
+
+Verdict: FAIL
+hook: Stop
+hook: Stop Completed
+tokens used
+74,030
+Two must-fixes prevent an unconditional pass.
+
+1. **Bind the check to the intended repository and index.** [data-real-guard.js:5](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/data-real-guard.js:5) inherits Git’s environment. Using only an allowed tracked tool file as a safe proxy, I measured:
+   - Normal environment: Git listed the tracked file.
+   - `GIT_INDEX_FILE` pointing to a nonexistent index: exit **0**, empty output.
+   - `GIT_WORK_TREE` redirected elsewhere: exit **0**, empty output.
+
+   The guard accepts both empty results. With `--no-git`, that permits otherwise-valid evidence to pass. Inherited Git variables can be an honest mistake; deliberately exploiting them also has a small fix. Clear repository/index overrides and anchor the intended repository. Apply the same isolation to the selftest’s Git commands, which currently inherit these variables too.
+
+2. **Handle Windows case variants.** The literal `data/real` pathspec is case-sensitive, even with `core.ignorecase=true`. I verified that behavior against allowed tool paths: exact spelling listed the tracked file; changed case returned exit **0** with nothing. An index entry under `data/REAL/...` can therefore escape this check while referring to the same Windows directory. Use case-insensitive matching on Windows and add a fixture case.
+
+The join itself is sound. At [gate-check.js:17](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/gate-check.js:17), guard failures enter `bad` before stage/outcome checks and before the `--no-git` condition. Nothing subsequently clears them. **Whenever the selected Git command returns paths or errors, the gate fails in every valid mode.**
+
+Fresh in-memory execution of the actual allowed source confirmed:
+
+- **20 tracked-output cases** exited 1 across before/final, pending/inconclusive/kept/reverted, both Git modes, and different caller directories.
+- Injected not-a-repository, missing-Git, other failure, signal, and buffer-overflow results each made the gate exit 1.
+- An empty successful result allowed the valid control to exit 0.
+
+The new selftest is **not vacuous under a normal environment**. It copies the actual gate and helper into a throwaway repo, establishes a passing control, stages a fake file, requires the gate to fail with that filename, then unstages it and requires another pass. Removing the join would fail its tracked-gate assertion. The outside-repository case tests only the helper.
+
+Test-first chronology is supported by the [recorded red/green output](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/docs/evidence/2026-10-26-f3-data-real-guard.md:16), especially the recorded failure with the join absent. One final commit cannot independently establish that chronology.
+
+Other bypass results and limits:
+
+| Attempt | Result |
+|---|---|
+| Caller cwd; paths containing spaces | In-memory checks rejected tracked output; gate anchors cwd to its script location. |
+| Staged but uncommitted file | Covered by the fixture’s code and recorded run; no commit is made. |
+| Subfolders; spaces or unusual filenames | Injected outputs were rejected; parsing needs only one nonempty line. |
+| Uppercase caller cwd | Actual safe Git probe still found the tracked tool file. |
+| Tracked `data/real` symlink or submodule | Inspection indicates detection: the symlink/gitlink path itself is listed. Injected outputs were rejected. |
+| Unregistered nested repo | Its independently tracked contents are outside the outer index. A nested repo at `fit-finder/` can also shadow the intended outer index; repository anchoring should address that. Not dynamically tested. |
+| Sparse checkout / skip-worktree | No filesystem-existence filter is present; these should remain visible through the index. Not dynamically tested. |
+| Another `data/real` elsewhere in the repo | Outside this check’s specified Fit Finder scope. |
+| Early exits and check order | Invalid arguments exit 2; unreadable evidence exits nonzero. Neither creates a successful bypass. Guard failures skip the later Git checks and reach exit 1. |
+
+The selftest run was blocked at `mkdtemp` with **EPERM**, before creating its fixture. I relied on code inspection and the recorded output for its filesystem behavior. I did not run `gate-selftest.js`, because it reads files outside your allowlist. No customer-data paths were opened or listed, and no files were edited.
+
+Verdict: FAIL
+exit 0
+````
diff --git a/fit-finder/tools/README.md b/fit-finder/tools/README.md
index 4d51b38..53a02df 100644
--- a/fit-finder/tools/README.md
+++ b/fit-finder/tools/README.md
@@ -16,7 +16,8 @@ Small scripts for the BCA run. Run them from `fit-finder/` (paths are relative t
 | `keep-check.js` | `<EV>` | `keep-check ok <outcome>` | 1 if the rule, the written REASON or the git state disagree |
 | `ops-check.js` | `<base sha>` | `ops-check ok <n> cards changed` | 1 on any violation |
 | `diag-nocard.js`, `diag-selftest.js` | `[--engine <path>]` (self-test only); selftest: none (needs `FF_LEDGER`) | `diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K`; selftest `diag-selftest ok` | 1 with `INVALID: ...` if tune wrong > 4, tune not-a-fit > BASE_K or half A wrong > 0; 2 on bad input. Reads only the tune set and half A |
-| `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees |
+| `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees, or (always, even with `--no-git`) git tracks anything under `data/real` |
+| `data-real-guard.js`, `data-real-guard-selftest.js` | none | `data-real-guard ok` / `data-real-guard FAIL: data/real is tracked by git: <paths>`; `data-real-guard-selftest ok (20 checks)` | 1 if `git -C <fit-finder> ls-files` lists any path with a `data/real` segment (any case) or itself fails; inherited `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_OBJECT_DIRECTORY` are dropped first; lists paths only, never reads the files. The selftest uses a throwaway repo with a fake file |
 | `engine-scope.js`, `gate-selftest.js` | `--git <sha>` or `--files <base> <new>`; selftest: none | `engine-scope ok` / `engine-scope FAIL: <problems>`; `gate-selftest ok` | 1 if `engine/fit.js` differs from the base outside the `OPS` block and the `let fit;`..`return { fit,` gate block (line endings ignored), an OPS key changed, or an added line has Date/performance/location/http/fetch/require(/process |
 | `selftest.js` | none | `selftest ok` or `selftest FAIL: ...` | 1 on the first failure |
 
diff --git a/fit-finder/tools/data-real-guard-selftest.js b/fit-finder/tools/data-real-guard-selftest.js
new file mode 100644
index 0000000..cb9334e
--- /dev/null
+++ b/fit-finder/tools/data-real-guard-selftest.js
@@ -0,0 +1,77 @@
+/* node tools/data-real-guard-selftest.js : exercises data-real-guard.js and its call from gate-check.js in a throwaway git repo
+   (fake files only; the real data/real is never read). Prints data-real-guard-selftest ok or the first failure. */
+const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
+const fail = (m) => { console.log('data-real-guard-selftest FAIL: ' + m); process.exit(1); };
+const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-real-guard-'));
+const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
+
+// throwaway repo shaped like workiva: <repo>/fit-finder/tools/{gate-check,data-real-guard}.js copied from this checkout
+const repo = path.join(tmp, 'repo'), ff = path.join(repo, 'fit-finder');
+fs.mkdirSync(path.join(ff, 'tools'), { recursive: true });
+fs.mkdirSync(path.join(ff, 'data', 'real'), { recursive: true });
+for (const f of ['gate-check.js', 'data-real-guard.js']) fs.copyFileSync(path.join(__dirname, f), path.join(ff, 'tools', f));
+if (git(repo, 'init', '-q').status !== 0) fail('git init');
+fs.writeFileSync(path.join(ff, 'data', 'real', 'fake.jsonl'), '{"fake":"not real data"}\n');
+fs.writeFileSync(path.join(ff, 'README.md'), 'x\n');
+git(repo, 'add', 'fit-finder/README.md');
+
+// a valid before-stage evidence doc (no-card 8, so no OUTCOME needed)
+const line = 'first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits 8 (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)';
+const ev = path.join(tmp, 'ev.md');
+fs.writeFileSync(ev, ['BASE-SHA: ae60341', 'BEFORE-LINE: ' + line, 'BEFORE: feature 17 of 29, wrong 2, no card 8, not-a-fit 0', 'PREDICTION-PM: x', 'PREDICTION-LEAD: y'].join('\n') + '\n');
+const gate = (env = {}) => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8', env: { ...process.env, ...env } });
+const guard = (cwd, env = {}) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp, ...env } });
+let n = 0;
+const expect = (name, r, code, re) => {
+  n++;
+  if (r.status !== code || !re.test(r.stdout)) fail(`${name}: want exit ${code} matching ${re}, got ${r.status}: ${(r.stdout + r.stderr).trim()}`);
+};
+
+// 1-2. control: data/real exists on disk but is untracked, so guard and done check pass
+expect('untracked guard', guard(ff), 0, /^data-real-guard ok/);
+expect('untracked gate', gate(), 0, /^gate-check ok before/);
+
+// 3-5. tracked: git add a file under data/real, and both fail naming it
+git(repo, 'add', '-f', 'fit-finder/data/real/fake.jsonl');
+expect('tracked guard', guard(ff), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
+expect('tracked gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
+const { trackedReal } = require(path.join(ff, 'tools', 'data-real-guard.js'));
+const t = trackedReal(ff);
+if (!t.ok || t.files.join() !== 'data/real/fake.jsonl') fail('trackedReal lists ' + JSON.stringify(t));
+n++;
+
+// 6-15. inherited git env vars that point git at another repo, index or tree must not hide the tracked file
+const other = path.join(tmp, 'other');
+fs.mkdirSync(other);
+git(other, 'init', '-q');
+const misleading = {
+  GIT_DIR: path.join(other, '.git'),
+  GIT_INDEX_FILE: path.join(tmp, 'empty-index'),
+  GIT_WORK_TREE: other,
+  GIT_COMMON_DIR: path.join(other, '.git'),
+  GIT_OBJECT_DIRECTORY: path.join(other, '.git', 'objects'),
+};
+for (const [k, v] of Object.entries(misleading)) {
+  expect(`${k} guard`, guard(ff, { [k]: v }), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
+  expect(`${k} gate`, gate({ [k]: v }), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
+}
+
+// 16. untrack again: passes again
+git(repo, 'rm', '-q', '--cached', 'fit-finder/data/real/fake.jsonl');
+expect('untracked again gate', gate(), 0, /^gate-check ok before/);
+
+// 17-19. a case variant (data/REAL) is caught too; put straight in the index so the test does not depend on the disk's case rules
+const blob = git(repo, 'hash-object', '-w', 'fit-finder/data/real/fake.jsonl').stdout.trim();
+git(repo, 'update-index', '--add', '--cacheinfo', `100644,${blob},fit-finder/data/REAL/x.jsonl`);
+expect('case variant guard', guard(ff), 1, /data-real-guard FAIL: .*data\/REAL\/x\.jsonl/);
+expect('case variant gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/REAL\/x\.jsonl/);
+git(repo, 'update-index', '--force-remove', 'fit-finder/data/REAL/x.jsonl');
+expect('case variant removed gate', gate(), 0, /^gate-check ok before/);
+
+// 20. fails closed outside a git repo (git ls-files errors)
+const bare = path.join(tmp, 'not-a-repo');
+fs.mkdirSync(bare);
+expect('no repo guard', guard(bare), 1, /data-real-guard FAIL: git ls-files failed/);
+
+fs.rmSync(tmp, { recursive: true, force: true });
+console.log(`data-real-guard-selftest ok (${n} checks)`);
diff --git a/fit-finder/tools/data-real-guard.js b/fit-finder/tools/data-real-guard.js
new file mode 100644
index 0000000..a2acadd
--- /dev/null
+++ b/fit-finder/tools/data-real-guard.js
@@ -0,0 +1,21 @@
+/* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
+   Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed).
+   Inherited GIT_DIR-style env vars are dropped so they cannot point git at another repo or index, and the data/real
+   segment is matched in any case (data/REAL on Windows is the same folder). */
+const { spawnSync } = require('child_process');
+const DROP = ['GIT_DIR', 'GIT_INDEX_FILE', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY'];
+const REAL = /(^|\/)data\/real(\/|$)/i;
+function trackedReal(dir) {
+  const env = { ...process.env };
+  for (const k of Object.keys(env)) if (DROP.includes(k.toUpperCase())) delete env[k];
+  const r = spawnSync('git', ['-C', dir, 'ls-files', '-z'], { cwd: dir, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
+  if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
+  return { ok: true, files: r.stdout.split('\0').filter((f) => f && REAL.test(f)) };
+}
+module.exports = { trackedReal };
+if (require.main === module) {
+  const t = trackedReal(process.cwd());
+  if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
+  if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
+  console.log('data-real-guard ok');
+}
diff --git a/fit-finder/tools/gate-check.js b/fit-finder/tools/gate-check.js
index 54ffe57..6d691d4 100644
--- a/fit-finder/tools/gate-check.js
+++ b/fit-finder/tools/gate-check.js
@@ -13,6 +13,10 @@ const get = (tag) => {
   return i < 0 ? null : { i, v: lines[i].slice(tag.length).trim() };
 };
 const bad = [];
+// always, even with --no-git: real data must never be tracked (studio-harness F3)
+const real = require('./data-real-guard.js').trackedReal(root);
+if (!real.ok) bad.push(real.error);
+else if (real.files.length) bad.push('data/real is tracked by git: ' + real.files.join(', '));
 function parse(text) {
   const m = (re) => { const x = re.exec(text); return x ? +x[1] : NaN; };
   const s = /split: right feature first (\d+) of (\d+)/.exec(text);
commit 3c059b4d53334a401cd5bad419cf2696f1ef8149
Author:     Ian <iansomintac.contact@gmail.com>
AuthorDate: Sun Oct 25 22:35:20 2026 -0700
Commit:     Ian <iansomintac.contact@gmail.com>
CommitDate: Sun Oct 25 22:35:20 2026 -0700

    fit-finder: data-real guard drops inherited GIT_DIR-style env vars and matches data/real in any case (Codex must-fixes)
    
    trackedReal now runs git -C <fit-finder> ls-files -z with GIT_DIR,
    GIT_INDEX_FILE, GIT_WORK_TREE, GIT_COMMON_DIR and GIT_OBJECT_DIRECTORY
    removed, and keeps paths matching /(^|\/)data\/real(\/|$)/i. Tests first:
    13 new selftest checks (20 in all); red on the old guard for GIT_DIR,
    GIT_INDEX_FILE, GIT_WORK_TREE and data/REAL. Evidence and tools README
    updated.
    
    Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>

hook: PostToolUse
 succeeded in 1357ms:
/* node tools/gate-selftest.js : exercises gate-check.js (--no-git, plus one git-mode engine-diff case) and engine-scope.js. Prints gate-selftest ok or the first failure. */
const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const gc = path.join(__dirname, 'gate-check.js');
const es = require('./engine-scope.js');
const fail = (m) => { console.log('gate-selftest FAIL: ' + m); process.exit(1); };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-selftest-'));
let n = 0;

// a score line; `cr` is the "first card right" number (differs from the split number on purpose)
const line = (R, F, W, N, K, cr) => `first card right: ${cr === undefined ? R + 3 : cr} of ${F + 4} that fit; wrong card ${W} (a); no card where one fits ${N} (b); card on a not-a-fit prompt ${K} (c); fit agreement 12 of 29; score 5; split: right feature first ${R} of ${F}, rightly none 3 (x)`;
const sum = (tag, R, F, W, N, K) => `${tag} feature ${R} of ${F}, wrong ${W}, no card ${N}, not-a-fit ${K}`;
function doc(o) {
  const b = o.b || [17, 29, 2, 8, 0], a = o.a;
  const L = ['BASE-SHA: ' + (o.sha || 'ae60341'), 'BEFORE-LINE: ' + line(...b), o.beforeSum || sum('BEFORE:', ...b)];
  if (!o.noPred) { if (!o.pmLate) L.push('PREDICTION-PM: x'); L.push('PREDICTION-LEAD: y'); }
  if (o.outcome && !a) L.push('OUTCOME: ' + o.outcome);
  if (o.reason) L.push('REASON: ' + o.reason);
  if (a) {
    L.push('AFTER-LINE: ' + line(...a), o.afterSum || sum('AFTER:', ...a));
    if (o.pmLate) L.push('PREDICTION-PM: x');
    L.push('OUTCOME: ' + o.outcome, 'REASON: ' + o.reason);
    if (o.pred) L.push('PREDICTION: ' + o.pred);
  }
  return L.join('\n') + '\n';
}
function run(stage, o, git) {
  const f = path.join(dir, 'ev' + (n++) + '.md');
  fs.writeFileSync(f, doc(o));
  const r = spawnSync('node', [gc, f, '--stage', stage].concat(git ? [] : ['--no-git']), { encoding: 'utf8' });
  return git ? r : r.status === 0;
}
const ok = (name, stage, o) => { if (!run(stage, o)) fail(name + ' should pass'); };
const bad = (name, stage, o) => { if (run(stage, o)) fail(name + ' should fail'); };

ok('before', 'before', {});
bad('before N0=5 no outcome', 'before', { b: [17, 29, 2, 5, 0] });
ok('before N0=5 inconclusive', 'before', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
bad('before N0=5 wrong reason', 'before', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'none' });
ok('final N0=5 inconclusive', 'final', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
bad('final N0=5 with after', 'final', { b: [17, 29, 2, 5, 0], a: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });

const B = [17, 29, 2, 8, 0];
ok('kept', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'held' });
bad('kept pred did not hold', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'did not hold' });
ok('reverted N', 'final', { b: B, a: [20, 29, 2, 7, 0], outcome: 'reverted', reason: 'no-card fall < 2 (8 to 7)', pred: 'did not hold' });
bad('kept when N fell 1', 'final', { b: B, a: [20, 29, 2, 7, 0], outcome: 'kept', reason: 'none', pred: 'held' });
ok('reverted W', 'final', { b: B, a: [20, 29, 3, 5, 0], outcome: 'reverted', reason: 'wrong card rose (2 to 3)', pred: 'did not hold' });
ok('reverted K', 'final', { b: B, a: [20, 29, 2, 5, 1], outcome: 'reverted', reason: 'not-a-fit card rose (0 to 1)', pred: 'did not hold' });
const all = [20, 29, 3, 8, 1], r1 = 'no-card fall < 2 (8 to 8)', r2 = 'wrong card rose (2 to 3)', r3 = 'not-a-fit card rose (0 to 1)';
ok('all three', 'final', { b: B, a: all, outcome: 'reverted', reason: [r1, r2, r3].join(' and '), pred: 'did not hold' });
bad('middle missing', 'final', { b: B, a: all, outcome: 'reverted', reason: [r1, r3].join(' and '), pred: 'did not hold' });
bad('first two swapped', 'final', { b: B, a: all, outcome: 'reverted', reason: [r2, r1, r3].join(' and '), pred: 'did not hold' });
bad('PM after AFTER-LINE', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'held', pmLate: true });
bad('summary disagrees', 'final', { b: B, a: [20, 29, 2, 6, 0], afterSum: sum('AFTER:', 21, 29, 2, 6, 0), outcome: 'kept', reason: 'none', pred: 'held' });
bad('summary from first card right', 'final', { b: B, a: [20, 29, 2, 6, 0, 24], afterSum: sum('AFTER:', 24, 33, 2, 6, 0), outcome: 'kept', reason: 'none', pred: 'held' });
ok('summary from split with differing first-card number', 'final', { b: B, a: [20, 29, 2, 6, 0, 24], outcome: 'kept', reason: 'none', pred: 'held' });

// git mode: engine/fit.js at BASE must be compared with HEAD (was a doubled path, always 'same')
const gr = run('before', { sha: '23757a5' }, true);
if (!/engine\/fit\.js differs from BASE/.test(gr.stdout)) fail('git mode: BASE with a different engine/fit.js should report that it differs; got: ' + gr.stdout.trim());

// engine-scope
const base = fs.readFileSync(path.join(root, 'engine/fit.js'), 'utf8').replace(/\r\n/g, '\n');
const crlf = (s) => s.replace(/\n/g, '\r\n');
const once = (s, a, b) => { const i = s.indexOf(a); if (i < 0) fail('anchor missing: ' + a); return s.slice(0, i) + b + s.slice(i + a.length); };
const opsAt = base.indexOf('    READ: /') + 11;
const gateAt = base.indexOf('    let fit;\n') + 14;
const inOps = base.slice(0, opsAt) + '  ' + base.slice(opsAt);              // a changed char inside OPS
const inGate = base.slice(0, gateAt) + ' ' + base.slice(gateAt);              // a changed char inside the gate block
const step = /STEP/.test(base) ? once(base, 'STEP', 'STEq') : fail('no STEP label in engine');
const expect = (name, got, empty) => { if (!!got.length === empty) fail('engine-scope ' + name + (empty ? ' should be empty: ' + got.join('; ') : ' should fail')); };
expect('same', es.check(base, base), true);
expect('ops change', es.check(base, inOps), true);
expect('gate change', es.check(base, inGate), true);
expect('STEP change', es.check(base, step), false);
const km = base.match(/^\s{4}([A-Z]+):/m)[1];
expect('deleted key', es.check(base, once(base, '    ' + km + ':', '    ' + km.toLowerCase() + 'x:')), false);
expect('Date in OPS', es.check(base, base.slice(0, opsAt) + '/*Date.now()*/' + base.slice(opsAt)), false);
expect('crlf vs lf', es.check(crlf(base), base), true);
const mixed = (s) => s.split('\n').map((l, i, all) => i % 2 && i < all.length - 1 ? l + '\r' : l).join('\n');
expect('lf vs mixed ops change', es.check(base, mixed(inOps)), true);
expect('mixed STEP', es.check(base, mixed(step)), false);
console.log('gate-selftest ok');
# fit-finder/tools

Small scripts for the BCA run. Run them from `fit-finder/` (paths are relative to where you run them). Every script exits non-zero on a problem. `node tools/selftest.js` exercises all of them on `tools/fixtures/` and prints `selftest ok`.

`L` below is the run ledger `<repo root>/.ledger/2026-10-22-fit-finder-bca` (git-ignored; the env var `FF_LEDGER` overrides it, used by the self-test only).

| Script | Arguments | Prints | Exit |
|---|---|---|---|
| `check-set.js` | `<prompts> <gold\|-> <catalogue> [--not-range LO HI]` | `rows N, per area FR a GRC b SUS c GEN d, gold M, not K, unknown cards U` | 1 on 0 rows, a row lacking string `id`/`task`, a repeated id, an `area` not in FR/GRC/SUS/GEN. With gold: a missing or extra gold id, `fit` not good/partial/not, `cards` not an array, a `not` row with cards, a card id not in the catalogue; with `--not-range`, K outside LO..HI |
| `nearcopy.js` | `<fresh> <real dir> [--catalogue <catalogue>]` | `files read F, rows read R, windows W`, `control: hit`, then `hits: none` or `hits: <fresh ids>`. Never prints text | 1 if F, R or W is 0, the positive control misses, or any hit. 5-word windows over every string value of every real row; with `--catalogue` a fresh row also hits on a window shared with any card's `try` |
| `agree.js` | `<frozen> <final>` | `N <n> D <d> agreement <pct> PASS\|FAIL` | 1 if an id set differs, a differing row (fit or sorted cards) lacks `"by":"ian"`, an unchanged row has it, or (N-D)/N < 0.845 (N=40: D <= 6) |
| `card-view.js` | `<catalogue> <out>` | `cards N` | writes `{"useCases":[...]}` with every card minus `match` and `ops` (`try` kept) |
| `label-sheet.js` | `<draft> <card-view> <out>`; or `--verify <sheet> <draft> <catalogue>` | `label-sheet rows N`; or `label-sheet ok` | 1 on bad input; `--verify` rebuilds the sheet from the draft and catalogue and needs a byte-for-byte match |
| `label-handoff.js` | `[--check] <looks file> <sheet> <ian batch json> <catalogue> <out frozen> <out gold>` | `label-handoff ok rows N changed D`, or `STOP: <reason>` | 3 on any `STOP`. `--check` recomputes both outputs in memory and exits 1 unless they equal the files byte for byte |
| `score-once.js` | `<name> <prompts> <gold> [--scorer <path>]` | the scorer's stdout (from `L/score-<name>.out` on a repeat) | the scorer's status. 3 with `STOP: unknown outcome` if `L/score-<name>.started` exists without `.out` |
| `keep-check.js` | `<EV>` | `keep-check ok <outcome>` | 1 if the rule, the written REASON or the git state disagree |
| `ops-check.js` | `<base sha>` | `ops-check ok <n> cards changed` | 1 on any violation |
| `diag-nocard.js`, `diag-selftest.js` | `[--engine <path>]` (self-test only); selftest: none (needs `FF_LEDGER`) | `diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K`; selftest `diag-selftest ok` | 1 with `INVALID: ...` if tune wrong > 4, tune not-a-fit > BASE_K or half A wrong > 0; 2 on bad input. Reads only the tune set and half A |
| `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees, or (always, even with `--no-git`) git tracks anything under `data/real` |
| `data-real-guard.js`, `data-real-guard-selftest.js` | none | `data-real-guard ok` / `data-real-guard FAIL: data/real is tracked by git: <paths>`; `data-real-guard-selftest ok (20 checks)` | 1 if `git -C <fit-finder> ls-files` lists any path with a `data/real` segment (any case) or itself fails; inherited `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_OBJECT_DIRECTORY` are dropped first; lists paths only, never reads the files. The selftest uses a throwaway repo with a fake file |
| `engine-scope.js`, `gate-selftest.js` | `--git <sha>` or `--files <base> <new>`; selftest: none | `engine-scope ok` / `engine-scope FAIL: <problems>`; `gate-selftest ok` | 1 if `engine/fit.js` differs from the base outside the `OPS` block and the `let fit;`..`return { fit,` gate block (line endings ignored), an OPS key changed, or an added line has Date/performance/location/http/fetch/require(/process |
| `selftest.js` | none | `selftest ok` or `selftest FAIL: ...` | 1 on the first failure |

## Details

**label-handoff.** The PICK is ONE line of space-separated `<id>=<label>` tokens after a `PICK` marker (on the same line, or the next non-empty line). Labels: a catalogue card id, `none`, `not`. Every sheet id (`### <id> | <area>` headings) appears exactly once. The batch needs a non-empty `words`, a boolean `accepted`, `sheetSha256` equal to the sheet's sha256 (and the sheet must match `L/label-sheet.sha256` if that exists), `changes[].id` in the sheet with a legal `label`, and empty `changes` when `accepted` is true. Frozen rows: `{"id","fit","cards","by":"pm"}` (card id: `good` + `[id]`; `none`: `good` + `[]`; `not`: `not` + `[]`). Gold = frozen with the changes applied and `"by":"ian"` on exactly the changed rows (a change equal to the PM label is ignored).

**score-once.** Runs `node tests/synth-score.js <prompts> <gold>` from `fit-finder/` (or `--scorer`, self-test only) at most once per `<name>`. First call: writes `.started`, runs, writes `.out` atomically (first line `STATUS <n>`, then stdout), prints stdout, exits with the scorer's status. Later calls print the saved stdout and exit with the saved status without running anything. Fresh/holdout/blind lines are copied only from `L/score-<name>.out`.

**keep-check.** Reads `BEFORE-LINE`, `AFTER-LINE`, `OUTCOME`, `REASON` from the evidence doc; R = number after `right feature first `, S = number after `score `. Kept iff R1 >= R0 + 1 and S1 <= S0. REASON must be `none` (kept) or `R gain < 1 (R0 to R1)` / `S rose (S0 to S1)` / `R gain < 1 and S rose (R0 to R1; S0 to S1)`. Git check against the commit whose subject starts `task 11:`: reverted needs `node tests/match-frozen.js --base <sha>` to pass; kept needs it to pass with `--allow ops` and fail without.

**ops-check.** Compares `data/catalogue.json` at `<base sha>` with the working tree: same cards in the same order, every field except `ops` equal, each `ops` starts with the old `ops` (append only), every added value is in `AI_OPS` (`engine/fit.js`, the list `tests/catalogue.test.js` checks), and at least one card changed.
# F3 (Fit Finder half): the done check fails when data/real is tracked

studio-harness F3 (premortem 7): "the Fit Finder done check fails if data/real is git-tracked". Branch `harness/f3-data-real-guard`, based on `prompt-coach` fb26061. Run 2026-10-26 ~01:05Z on Ian's PC.

## What changed

- `fit-finder/tools/data-real-guard.js`: runs `git ls-files -- data/real` from `fit-finder/`; exit 1 if it lists anything, and exit 1 if git itself fails (fails closed). Lists paths only, never reads the files.
- `fit-finder/tools/gate-check.js` (the Fit Finder done/gate check) calls it on every run, even with `--no-git`, and adds `data/real is tracked by git: <paths>` to its FAIL reasons.
- `fit-finder/tools/data-real-guard-selftest.js`: test, written first. A throwaway git repo shaped like workiva gets copies of the real `gate-check.js` and `data-real-guard.js` and one fake file `fit-finder/data/real/fake.jsonl`. The real `data/real` is never opened.
- `fit-finder/tools/README.md`: the gate-check row names the new failure; one row for the guard and its selftest.

Choice logged: Fit Finder has no GOAL.md done line, so "the done check" is taken to be `tools/gate-check.js`, the only gate check script, and the guard is also runnable alone.

## Test run (commands from `fit-finder/`)

Red 1, guard not written: `node tools/data-real-guard-selftest.js` -> exit 1, `ENOENT ... copyfile ...tools\data-real-guard.js`.

Red 2, guard written but not called by gate-check (the join):
```
data-real-guard-selftest FAIL: tracked gate: want exit 1 matching /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/, got 0: gate-check ok before pending; before feature 17 of 29 wrong 2 no-card 8 not-a-fit 0
exit 1
```

Green, after the call in gate-check:
```
## data-real-guard-selftest
data-real-guard-selftest ok (7 checks)
exit 0
## gate-selftest
gate-selftest ok
exit 0
## data-real-guard on this checkout
data-real-guard ok
exit 0
```

The 7 checks: untracked file on disk passes (guard, gate); `git add -f` of the fake file fails (guard and gate, each naming the path; `trackedReal` lists exactly it); `git rm --cached` passes again; outside any repo the guard fails closed (`git ls-files failed`). On this checkout nothing under `data/real` is tracked.

## Round 2: the two Codex must-fixes (2026-10-26 ~05:40Z, Ian's PC)

The Codex judge of d007e0b (`docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md`) failed it on two must-fixes: inherited `GIT_INDEX_FILE` / `GIT_WORK_TREE` (and similar) make `git ls-files` print nothing and exit 0, and the case-sensitive `data/real` pathspec lets `data/REAL/...` past on Windows.

Fix in `data-real-guard.js`: git runs as `git -C <fit-finder> ls-files -z` with `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` removed from its environment (any case of the name), and the output is filtered with `/(^|\/)data\/real(\/|$)/i`, so a `data/real` segment in any case, at any depth under `fit-finder/`, fails.

Tests added first to the selftest (13 new checks, 20 in all):
- checks 6-15: with the fake file tracked, each of the five env vars set to point at a second throwaway repo (or an empty index path), guard and gate must still fail naming `data/real/fake.jsonl`;
- checks 17-19: `fit-finder/data/REAL/x.jsonl` put straight into the index with `git update-index --cacheinfo` (so the test does not depend on the disk's case rules) must fail guard and gate, and pass again once removed.

Red against the old guard (each new check run alone in a scratch copy): `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE` and the `data/REAL` case each got `exit 0: data-real-guard ok`. `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` did not hide the file even before the fix; their checks stay as regression guards, not proof of the fix.

Green after the fix:
```
## data-real-guard-selftest
data-real-guard-selftest ok (20 checks)
## gate-selftest
gate-selftest ok
## data-real-guard on this checkout
data-real-guard ok
```
# F3 (Fit Finder half): fresh Codex judge, 2026-10-26

Command (from Ian's PC, codex-cli 0.163.0, branch harness/f3-data-real-guard at d007e0b; the prompt is echoed at the top of the output):

```
codex exec --sandbox read-only --ephemeral -C "C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard" "$(cat prompt.txt)" < /dev/null
```

Result: **Verdict: FAIL**, two must-fixes: (1) the guard inherits GIT_INDEX_FILE / GIT_WORK_TREE, which can make `git ls-files` print nothing and exit 0; (2) the `data/real` pathspec is case-sensitive, so on Windows `data/REAL/...` gets past it. The join with gate-check was judged sound in every mode, and the selftest not vacuous. The selftest could not run in the read-only sandbox (mkdtemp EPERM). Not fixed in this commit.

## Full output

````
Reading additional input from stdin...
OpenAI Codex v0.163.0
--------
workdir: C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
model: gpt-6.1-sol
provider: openai
approval: on-request
sandbox: read-only
reasoning effort: high
reasoning summaries: none
session id: 01a17667-870b-76b1-97fe-38ec9708b1ee
--------
user
You are a fresh, independent judge. Review branch harness/f3-data-real-guard (commit d007e0b) of this repo. Read-only: do not edit files.

HARD RULE: never open, list, cat, grep or git-show anything under fit-finder/data/ or any data/real path (real customer data and labels). Read only: fit-finder/tools/gate-check.js, fit-finder/tools/data-real-guard.js, fit-finder/tools/data-real-guard-selftest.js, fit-finder/tools/gate-selftest.js, fit-finder/tools/README.md, docs/evidence/2026-10-26-f3-data-real-guard.md, and git metadata (git log, git diff prompt-coach...HEAD -- fit-finder/tools docs/evidence). The sandbox is read-only, so the selftests may not run (they write to the temp dir); if so, judge from the code and the recorded output in the evidence file, and say so.

Requirement (studio-harness F3): the Fit Finder done check (fit-finder/tools/gate-check.js) must fail whenever git tracks anything under data/real (that is, `git ls-files -- data/real` run from fit-finder/ prints anything), including failing when git itself errors. It must be proved by a test written first that uses a throwaway repo as the fixture, never the real data.

Answer:
1. Does gate-check.js fail whenever git tracks anything under fit-finder/data/real, in every mode (--no-git, --stage before, --stage final, any outcome)? Does it fail when git errors (not a repo, git missing, other failure)?
2. Does data-real-guard-selftest.js prove it with a throwaway repo, testing the real gate-check join and not only the helper? Is any check vacuous (true by construction)?
3. Try your own bypasses and name each one with its result: for example the cwd it runs from, paths with spaces or unusual names, files staged but not committed, files in subfolders, case differences on Windows, a data/real symlink, nested repos or submodules, GIT_DIR/GIT_WORK_TREE or similar env vars, sparse checkout or skip-worktree, a data/real path elsewhere in the repo, early exits in gate-check before the guard runs, the order of checks.

Must-fix rule: a must-fix is anything that ordinary use or an honest mistake gets past. A deliberate trick counts as a must-fix only if the fix is small. List must-fixes first, then minor notes.

End your reply with exactly one final line: "Verdict: PASS" (no must-fix) or "Verdict: FAIL" (one or more must-fixes).
warning: loading hooks from both C:\Users\teasp\.codex\hooks.json and C:\Users\teasp\.codex\config.toml; prefer a single representation for this layer
2026-10-26T04:11:03.900046Z ERROR codex_rmcp_client::oauth::refresh_transaction: error=failed to refresh OAuth tokens for server openart: OAuth refresh token was rejected: Server returned error response: invalid_grant: The refresh token is invalid, expired, or revoked.
hook: SessionStart
hook: SessionStart
hook: SessionStart
hook: SessionStart Completed
hook: SessionStart Completed
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
Time budget: about 15 minutes. I�?Tll review the allowed files and branch metadata, then try isolated bypass checks where the read-only sandbox permits them. I�?Tll leave all customer-data paths untouched.
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node "C:/Users/teasp/Documents/studio-harness/plugin/scripts/live_copy.mjs"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 670ms:
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"LIVE COPY NOT UPDATED: fetch failed; 0 behind origin/main; this session runs old harness rules; say this in your first line to the user"}}
hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node "C:/Users/teasp/Documents/studio-harness/plugin/scripts/goal_start.mjs"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 335ms:
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"NO GOAL.md in C:\\Users\\teasp\\Documents\\workiva\\.claude\\worktrees\\f3-data-real-guard: a hand-off from here will be refused by town-launch until Ian approves one."}}
hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node "C:/Users/teasp/Documents/studio-harness/bin/brain.mjs" context' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 903ms:
CHECKS
Run node --test --test-name-pattern='git.exe|gh.exe' test/slip_guard.test.mjs; in a run with no slip, git.exe push, GIT.EXE push, a full path to git (forward or back slashes) and a full path to gh.exe pr merge must each exit 2. [2026-10-13-slip-guard-misses-git-exe]
Run node --test --test-name-pattern='attached -C' test/slip_guard.test.mjs; from a work-branch repo, git -C<main repo> merge and git -C\"<main repo>\" merge must exit 2 while the same merge without -C exits 0. [2026-10-13-slip-guard-attached-c-merge]
Run node --test --test-name-pattern='detail prefers the spawn error code' test/evalrun.test.mjs; a run whose spawn fails must name the error code in its detail, never UNKNOWN. [2026-09-06-spawn-failure-detail-carries-no-error-message]
ASK
node "C:\Users\teasp\Documents\studio-harness\bin\brain.mjs" query <words> | show <page-id> | gate "<task>" | why <page>

hook: PostToolUse
hook: PostToolUse Completed
codex
The required startup checks report that the harness refresh failed and this worktree has no GOAL.md. Neither blocks this read-only review. I�?Tm applying `$superpowers:using-superpowers`, `$task-observer`, and `$superpowers:verification-before-completion`; I won�?Tt write review notes into the repo or shared memory.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git log -5 --oneline --decorate' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath "C:/Users/teasp/.agents/skills/task-observer/SKILL.md"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath "C:/Users/teasp/.codex/plugins/cache/superpowers-marketplace/superpowers/7.0.1/skills/using-superpowers/SKILL.md"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff prompt-coach...HEAD -- fit-finder/tools docs/evidence' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 662ms:
d007e0b (HEAD -> harness/f3-data-real-guard, origin/harness/f3-data-real-guard) fit-finder: gate-check fails when data/real is tracked by git (studio-harness F3)
fb26061 (origin/backup/prompt-coach-before-prompt-coach-sod-conflict-2026-10-25) Merge prompt-coach-c3-sandbox: C3 sandbox test (C3a 13/24 MISS, C3b 0/24 PASS, C3c 58 vs 63 MISS), evidence, next talk prompt
156034f (origin/prompt-coach-c3-sandbox, prompt-coach-c3-sandbox) Prompt coach C3: next talk prompt (after C3 miss)
2aec56c Prompt coach C3: README wording (final review note: "never run" read as current)
ab6e654 Prompt coach C3 sandbox: results (C3a/C3b/C3c)

hook: PostToolUse
 succeeded in 483ms:
diff --git a/docs/evidence/2026-10-26-f3-data-real-guard.md b/docs/evidence/2026-10-26-f3-data-real-guard.md
new file mode 100644
index 0000000..b7329e2
--- /dev/null
+++ b/docs/evidence/2026-10-26-f3-data-real-guard.md
@@ -0,0 +1,37 @@
+# F3 (Fit Finder half): the done check fails when data/real is tracked
+
+studio-harness F3 (premortem 7): "the Fit Finder done check fails if data/real is git-tracked". Branch `harness/f3-data-real-guard`, based on `prompt-coach` fb26061. Run 2026-10-26 ~01:05Z on Ian's PC.
+
+## What changed
+
+- `fit-finder/tools/data-real-guard.js`: runs `git ls-files -- data/real` from `fit-finder/`; exit 1 if it lists anything, and exit 1 if git itself fails (fails closed). Lists paths only, never reads the files.
+- `fit-finder/tools/gate-check.js` (the Fit Finder done/gate check) calls it on every run, even with `--no-git`, and adds `data/real is tracked by git: <paths>` to its FAIL reasons.
+- `fit-finder/tools/data-real-guard-selftest.js`: test, written first. A throwaway git repo shaped like workiva gets copies of the real `gate-check.js` and `data-real-guard.js` and one fake file `fit-finder/data/real/fake.jsonl`. The real `data/real` is never opened.
+- `fit-finder/tools/README.md`: the gate-check row names the new failure; one row for the guard and its selftest.
+
+Choice logged: Fit Finder has no GOAL.md done line, so "the done check" is taken to be `tools/gate-check.js`, the only gate check script, and the guard is also runnable alone.
+
+## Test run (commands from `fit-finder/`)
+
+Red 1, guard not written: `node tools/data-real-guard-selftest.js` -> exit 1, `ENOENT ... copyfile ...tools\data-real-guard.js`.
+
+Red 2, guard written but not called by gate-check (the join):
+```
+data-real-guard-selftest FAIL: tracked gate: want exit 1 matching /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/, got 0: gate-check ok before pending; before feature 17 of 29 wrong 2 no-card 8 not-a-fit 0
+exit 1
+```
+
+Green, after the call in gate-check:
+```
+## data-real-guard-selftest
+data-real-guard-selftest ok (7 checks)
+exit 0
+## gate-selftest
+gate-selftest ok
+exit 0
+## data-real-guard on this checkout
+data-real-guard ok
+exit 0
+```
+
+The 7 checks: untracked file on disk passes (guard, gate); `git add -f` of the fake file fails (guard and gate, each naming the path; `trackedReal` lists exactly it); `git rm --cached` passes again; outside any repo the guard fails closed (`git ls-files failed`). On this checkout nothing under `data/real` is tracked.
diff --git a/fit-finder/tools/README.md b/fit-finder/tools/README.md
index 4d51b38..9e07528 100644
--- a/fit-finder/tools/README.md
+++ b/fit-finder/tools/README.md
@@ -16,7 +16,8 @@ Small scripts for the BCA run. Run them from `fit-finder/` (paths are relative t
 | `keep-check.js` | `<EV>` | `keep-check ok <outcome>` | 1 if the rule, the written REASON or the git state disagree |
 | `ops-check.js` | `<base sha>` | `ops-check ok <n> cards changed` | 1 on any violation |
 | `diag-nocard.js`, `diag-selftest.js` | `[--engine <path>]` (self-test only); selftest: none (needs `FF_LEDGER`) | `diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K`; selftest `diag-selftest ok` | 1 with `INVALID: ...` if tune wrong > 4, tune not-a-fit > BASE_K or half A wrong > 0; 2 on bad input. Reads only the tune set and half A |
-| `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees |
+| `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees, or (always, even with `--no-git`) git tracks anything under `data/real` |
+| `data-real-guard.js`, `data-real-guard-selftest.js` | none | `data-real-guard ok` / `data-real-guard FAIL: data/real is tracked by git: <paths>`; `data-real-guard-selftest ok (7 checks)` | 1 if `git ls-files -- data/real` lists anything or itself fails; lists paths only, never reads the files. The selftest uses a throwaway repo with a fake file |
 | `engine-scope.js`, `gate-selftest.js` | `--git <sha>` or `--files <base> <new>`; selftest: none | `engine-scope ok` / `engine-scope FAIL: <problems>`; `gate-selftest ok` | 1 if `engine/fit.js` differs from the base outside the `OPS` block and the `let fit;`..`return { fit,` gate block (line endings ignored), an OPS key changed, or an added line has Date/performance/location/http/fetch/require(/process |
 | `selftest.js` | none | `selftest ok` or `selftest FAIL: ...` | 1 on the first failure |
 
diff --git a/fit-finder/tools/data-real-guard-selftest.js b/fit-finder/tools/data-real-guard-selftest.js
new file mode 100644
index 0000000..d7ab6b3
--- /dev/null
+++ b/fit-finder/tools/data-real-guard-selftest.js
@@ -0,0 +1,53 @@
+/* node tools/data-real-guard-selftest.js : exercises data-real-guard.js and its call from gate-check.js in a throwaway git repo
+   (fake files only; the real data/real is never read). Prints data-real-guard-selftest ok or the first failure. */
+const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
+const fail = (m) => { console.log('data-real-guard-selftest FAIL: ' + m); process.exit(1); };
+const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-real-guard-'));
+const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
+
+// throwaway repo shaped like workiva: <repo>/fit-finder/tools/{gate-check,data-real-guard}.js copied from this checkout
+const repo = path.join(tmp, 'repo'), ff = path.join(repo, 'fit-finder');
+fs.mkdirSync(path.join(ff, 'tools'), { recursive: true });
+fs.mkdirSync(path.join(ff, 'data', 'real'), { recursive: true });
+for (const f of ['gate-check.js', 'data-real-guard.js']) fs.copyFileSync(path.join(__dirname, f), path.join(ff, 'tools', f));
+if (git(repo, 'init', '-q').status !== 0) fail('git init');
+fs.writeFileSync(path.join(ff, 'data', 'real', 'fake.jsonl'), '{"fake":"not real data"}\n');
+fs.writeFileSync(path.join(ff, 'README.md'), 'x\n');
+git(repo, 'add', 'fit-finder/README.md');
+
+// a valid before-stage evidence doc (no-card 8, so no OUTCOME needed)
+const line = 'first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits 8 (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)';
+const ev = path.join(tmp, 'ev.md');
+fs.writeFileSync(ev, ['BASE-SHA: ae60341', 'BEFORE-LINE: ' + line, 'BEFORE: feature 17 of 29, wrong 2, no card 8, not-a-fit 0', 'PREDICTION-PM: x', 'PREDICTION-LEAD: y'].join('\n') + '\n');
+const gate = () => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8' });
+const guard = (cwd) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp } });
+let n = 0;
+const expect = (name, r, code, re) => {
+  n++;
+  if (r.status !== code || !re.test(r.stdout)) fail(`${name}: want exit ${code} matching ${re}, got ${r.status}: ${(r.stdout + r.stderr).trim()}`);
+};
+
+// 1-2. control: data/real exists on disk but is untracked, so guard and done check pass
+expect('untracked guard', guard(ff), 0, /^data-real-guard ok/);
+expect('untracked gate', gate(), 0, /^gate-check ok before/);
+
+// 3-5. tracked: git add a file under data/real, and both fail naming it
+git(repo, 'add', '-f', 'fit-finder/data/real/fake.jsonl');
+expect('tracked guard', guard(ff), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
+expect('tracked gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
+const { trackedReal } = require(path.join(ff, 'tools', 'data-real-guard.js'));
+const t = trackedReal(ff);
+if (!t.ok || t.files.join() !== 'data/real/fake.jsonl') fail('trackedReal lists ' + JSON.stringify(t));
+n++;
+
+// 6. untrack again: passes again
+git(repo, 'rm', '-q', '--cached', 'fit-finder/data/real/fake.jsonl');
+expect('untracked again gate', gate(), 0, /^gate-check ok before/);
+
+// 7. fails closed outside a git repo (git ls-files errors)
+const bare = path.join(tmp, 'not-a-repo');
+fs.mkdirSync(bare);
+expect('no repo guard', guard(bare), 1, /data-real-guard FAIL: git ls-files failed/);
+
+fs.rmSync(tmp, { recursive: true, force: true });
+console.log(`data-real-guard-selftest ok (${n} checks)`);
diff --git a/fit-finder/tools/data-real-guard.js b/fit-finder/tools/data-real-guard.js
new file mode 100644
index 0000000..4e60565
--- /dev/null
+++ b/fit-finder/tools/data-real-guard.js
@@ -0,0 +1,15 @@
+/* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
+   Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed). */
+const { spawnSync } = require('child_process');
+function trackedReal(dir) {
+  const r = spawnSync('git', ['ls-files', '--', 'data/real'], { cwd: dir, encoding: 'utf8' });
+  if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
+  return { ok: true, files: r.stdout.split(/\r?\n/).filter(Boolean) };
+}
+module.exports = { trackedReal };
+if (require.main === module) {
+  const t = trackedReal(process.cwd());
+  if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
+  if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
+  console.log('data-real-guard ok');
+}
diff --git a/fit-finder/tools/gate-check.js b/fit-finder/tools/gate-check.js
index 54ffe57..6d691d4 100644
--- a/fit-finder/tools/gate-check.js
+++ b/fit-finder/tools/gate-check.js
@@ -13,6 +13,10 @@ const get = (tag) => {
   return i < 0 ? null : { i, v: lines[i].slice(tag.length).trim() };
 };
 const bad = [];
+// always, even with --no-git: real data must never be tracked (studio-harness F3)
+const real = require('./data-real-guard.js').trackedReal(root);
+if (!real.ok) bad.push(real.error);
+else if (real.files.length) bad.push('data/real is tracked by git: ' + real.files.join(', '));
 function parse(text) {
   const m = (re) => { const x = re.exec(text); return x ? +x[1] : NaN; };
   const s = /split: right feature first (\d+) of (\d+)/.exec(text);

hook: PostToolUse
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath "C:/Users/teasp/.codex/plugins/cache/superpowers-marketplace/superpowers/7.0.1/skills/verification-before-completion/SKILL.md"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 1250ms:
---
name: using-superpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## The Rule

**Invoke relevant or requested skills BEFORE any response or action** ���?" including clarifying questions, exploring the codebase, or checking files. If it turns out wrong for the situation, you don't have to use it.

**Before entering plan mode:** if you haven't already brainstormed, invoke the brainstorming skill first.

Then announce "Using [skill] to [purpose]" and follow the skill exactly. If it has a checklist, create a todo per item.

## Skill Priority

When multiple skills apply, process skills come first ���?" they set the approach, then implementation skills (frontend-design, etc.) carry it out. Brainstorming and systematic-debugging are Superpowers' most common process skills, but the rule holds for any of them.

- "Let's build X" ���+' superpowers:brainstorming first, then implementation skills.
- "Fix this bug" ���+' superpowers:systematic-debugging first, then domain skills.

## Red Flags

These thoughts mean STOP���?"you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ���%��� using the skill. Invoke it. |

## Platform Adaptation

If your harness appears here, read its reference file for special instructions:

- Claude Code: `references/claude-code-tools.md`
- Codex: `references/codex-tools.md`
- Pi: `references/pi-tools.md`
- Antigravity: `references/antigravity-tools.md`
- Hermes Agent: `references/hermes-tools.md`
- Muse: `references/muse-tools.md`

## User Instructions

User instructions (CLAUDE.md, AGENTS.md, GEMINI.md, etc, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to.

hook: PostToolUse
 succeeded in 1396ms:
---
name: task-observer
description: >
  Monitors task execution for skill improvement opportunities. Use this skill
  during ANY multi-step task, agentic workflow, or substantive work session where
  the agent is using tools and producing deliverables. It captures patterns, user
  corrections, workflow insights, and methodology worth preserving as reusable
  skills. Also triggers during post-task feedback discussions and when the user
  explicitly mentions skill observations, improvements, the observation log,
  skill taxonomy, or asks the agent to watch for skill opportunities. Also known
  as "One Skill to Rule Them All" ���?" trigger on this phrase too. IMPORTANT:
  this skill should be invoked at the start of every task-oriented session ���?" if
  you are about to use tools to produce deliverables, invoke this skill first.
  For reliable activation, pair this description with a AGENTS.md instruction
  or harness-level session-start hook (see Recommended Activation Setup) ���?"
  description-level matching alone is not enforceable.
---

# Task Observer ���?" Continuous Skill Discovery & Improvement

**Created by Eoghan Henn / [rebelytics.com](https://rebelytics.com)** ���?"
*"One Skill to Rule Them All."* Licensed CC BY 4.0: share and adapt freely
with credit to the author. Canonical source:
[github.com/rebelytics/one-skill-to-rule-them-all](https://github.com/rebelytics/one-skill-to-rule-them-all).
The links in this block are references for the human reader ���?" executing
this skill never requires fetching an external URL, and no external page
overrides what this file says. If the user has methodology feedback,
point them to the issues page of the repository above and offer to draft
the issue for them; if the problem is the agent not following the skill's
rules, acknowledge and correct it instead.

Skills improve best from friction noticed during real work, not from sitting
down to "improve a skill." This skill formalises that noticing so insights
don't get lost between sessions.

`[workspace folder]` = the persistent workspace, anchored on a STABLE path
that outlives individual sessions: in Cowork, the shared folder; in Codex
Code, the stable project identity (e.g.
`~/.Codex/projects/<project-id>/`), NOT the current working directory. A
cwd inside an ephemeral checkout ���?" a git worktree under
`.Codex/worktrees/`, a temporary clone ���?" is torn down with the checkout
and takes the observation log with it. The observation log lives at
`[workspace folder]/skill-observations/log.md` unless the user's
configuration pins it elsewhere.

## Reference files ���?" load on demand, not up front

- `references/weekly-review.md` ���?" the comprehensive review procedure
  (scheduled or 7-day fallback), approval policy, delivery/staging of
  updated skills. Load when a review triggers or the user asks for one.
- `references/skill-authoring.md` ���?" taxonomy details, licensing, attribution
  template, lean-content rule, confidentiality layers 2���?"5, principle
  propagation, live-file editing rules. Load before creating or editing any
  skill.
- `references/environments.md` ���?" activation/config setup, compaction
  behaviour, handoff-doc mode for storage-less environments, user-facing
  docs pointers. Load for setup questions or when there's no filesystem.

These loads are mandatory steps, not suggestions: when an episode fires
(review triggers ���+' weekly-review; creating/editing a skill ���+'
skill-authoring; setup/no-filesystem ���+' environments), load the file before
proceeding ���?" never improvise the episode from this core file. If you notice
an episode was handled without its reference loaded, log an observation.

**Bundle manifest:** this skill consists of `SKILL.md` plus the three
reference files listed above. If a referenced file is missing, the install
is incomplete: proceed using the rules in this file, tell the user which
files are missing, and point them to the full bundle at the canonical
source (for the published version, the repository in the attribution
above).

## Session Start Protocol

1. If `skill-observations/log.md` or `cross-cutting-principles.md` don't
   exist, create them (templates below / in the principles section of
   `references/skill-authoring.md`). Also create
   `skill-observations/last-review-date.txt` containing the literal value
   `never` if it doesn't exist ���?" never write a date into it at setup; a
   date means a review actually ran. Before creating or writing anything:
   if the resolved workspace folder sits under an ephemeral path (e.g.
   `.Codex/worktrees/`, a temporary clone), warn the user and re-anchor
   on the stable project path first ���?" state written to an ephemeral
   checkout is lost at teardown.
2. Scan OPEN observations and active principles; hold them in awareness,
   don't surface unprompted.
3. Read `skill-observations/last-review-date.txt`. The value carries the
   truth: a date = when the last review actually ran; `never` = no review
   has run yet. A missing file is abnormal (step 1 creates it) ���?" recreate
   it with `never`, don't invent a date. If the value is `never` or older
   than 7 days AND there are OPEN observations: in an interactive session,
   offer the review in one line ("the observation backlog hasn't been
   reviewed [in N days / yet] ���?" run it now, or carry on with your task?")
   and proceed with the user's task unless they opt in; never gate their
   work on the review. Only a scheduled/autonomous run loads
   `references/weekly-review.md` and runs the review unprompted.
4. Once per session: if no AGENTS.md (or equivalent) activation instruction
   for this skill exists, briefly suggest adding one (see
   `references/environments.md`). Skip if already configured.
5. Note the log's modification time. If modified in the last few hours,
   another session may be writing to it ���?" re-read immediately before every
   append, never trust a remembered "current number".

## When to Observe

Active for the entire task session: execution, post-task feedback and
review discussion, meta-discussion about skills or methodology, and
reflective/strategy conversations about how work should be done. **The
observation mindset does not deactivate when the conversation shifts from
doing the work to discussing it** ���?" user feedback in review phases is often
the highest-signal input. Inactive only for casual conversation and quick
factual questions with no tools or deliverables involved.

## What to Watch For

**Signals for a NEW skill:** a reusable multi-step workflow; a methodology
the user explains that no existing skill captures; a recurring task type
with similar structure; a process with clear inputs, phases, outputs; the
user describing a refined process ("I always do it this way"); a structured
approach emerging naturally during work.

**Signals for IMPROVING an existing skill:** anything from a task that used
a skill and could make it better ���?" problems, positive signals, or neutral
gaps. Examples: the agent violates a documented rule (the skill needs
enforcement, not louder rules); a user correction reveals a missing rule or
edge case; a better workflow emerges than the skill recommends; a technique
works well enough to promote from incidental to recommended; an undocumented
use case; feedback that generalises; a wrong assumption; new tooling
obsoletes a step; corrections forming a pattern; a principle that applies to
other skills too; a naming/framing/structural suggestion, even
conversational.

**Signals for SIMPLIFYING a skill:** a section never relevant across many
sessions; a rule from a single unvalidated observation; workflows users
consistently shortcut; sections loaded but never acted on; contradictory
rules; "just in case" complexity that never triggered; a rule the agent
consistently fails to follow (convert to structural enforcement ���?" checklist,
verification step, unskippable tool call ���?" or remove it). Treat these as a
review checklist; ask "what can we remove?" as deliberately as "what should
we add?"

**Do NOT log:** one-off corrections that don't generalise; preferences
already captured in a skill; tool bugs unrelated to methodology;
observations that would need proprietary client information to be useful in
an open-source skill (unless an internal skill is the right home).

## How to Log

Append to the log **silently, within the same turn or the next** ���?" never
batch mentally for later; the act of writing is the enforcement mechanism.

**Mandatory observation checkpoint after every 3rd TodoWrite completion:** After
marking the 3rd, 6th, 9th (etc.) TodoWrite item as completed in a session, you
must **write to the log** ���?" not merely pause to ask yourself a question. Either
append any pending observations, or, if genuinely none have accumulated, append
an explicit acknowledgement marker (a one-line `no observations` note for that
checkpoint). The required action is a concrete log write; a remembered "ask
whether" is not enforcement. This is a hard checkpoint, not a suggestion ���?" the
skill has demonstrated that softer "check when completing items" or "pause and
ask" guidance gets lost during cognitively demanding analytical work, exactly
when the most observations accumulate. The count doesn't need to be precise;
the rule is: roughly every third completion, write to the log (observations or
the acknowledgement marker). The write itself is the enforcement mechanism: it
forces the mental check to surface as a recorded action, and it prevents the
common failure mode where the skill is loaded but no observations are written
until the user explicitly asks.

**Deliverable-event flush:** Hard enforcement that hooks onto tool calls you are
already making is the only reliable mechanism; soft prompts that rely on memory
don't survive cognitive load during long substantive sessions (when the most
insights surface). So tie observation-flushing to deliverable and workflow events
that already involve a tool call. Whenever you present or render a major
deliverable ���?" `present_files`, a deck or PDF render, a staged skill file handed
to the user ���?" or complete a task/todo batch, flush any pending observations to
the log at that moment, before moving on. These are natural, already-occurring
checkpoints; piggy-backing the flush onto them means the write happens as a
side effect of work you were doing anyway, rather than depending on a separate
act of memory.

**Numbering discipline (mandatory, every append):**

1. *Pre-check:* read the actual log and find the highest existing number ���?"
   never trust session memory:

   ```bash
   # GNU grep:
   grep -oP '### Observation \K\d+' log.md | sort -n | tail -1
   # macOS / POSIX:
   grep -o '### Observation [0-9]*' log.md | grep -o '[0-9]*' | sort -n | tail -1
   ```

2. *Pre-write assertion:* immediately before appending, confirm the proposed
   number doesn't already exist:

   ```bash
   PROPOSED=$(( $(grep -oP '### Observation \K\d+' log.md | sort -n | tail -1) + 1 ))
   grep -qE "^### Observation ${PROPOSED}:" log.md && {
     echo "COLLISION on #${PROPOSED}"; exit 1; }
   ```

   If it fires, increment past all existing numbers and re-check (and log a
   meta-observation ���?" it signals a parallel-session collision).

3. *Post-write verification:* after appending, count occurrences of the
   number; if >1, a parallel writer collided between check and write ���?"
   renumber YOUR entry to max+1. Identify your entry from your own append
   operation (capture the file's line count immediately before and after
   your `>>`; your entry starts at the old line count + 1) ���?" do NOT
   re-grep and take the last occurrence, which may be a colliding writer's
   entry appended after yours. After any `sed` renumber, re-read the
   affected line to confirm the substitution actually took effect ���?" a
   line-addressed `s///` whose target shifted finds no match and still
   exits 0. Pre-write catches stale reads; only a post-write check catches
   the race. The pattern for shared logs written by parallel agents is
   check-then-act-then-verify.

**Log-write safety ���?" never let a mutation span entry boundaries:** When
mutating the log programmatically (marking entries ACTIONED/DECLINED,
archiving, renumbering), a greedy or DOTALL pattern over the whole file can
silently swallow everything from one match to EOF. This has happened: a
`.*$` under `re.S` over the multi-entry file captured from one entry's
Status line to end-of-file and overwrote 16 later entries in a single
substitution. The log is shared state across many entries; mutate it one
bounded entry at a time and verify every mutation.

1. **Re-read and merge immediately before any write-back.** Any full-file
   rewrite (archival, renumbering, reassembly from chunks) built from a
   snapshot destroys whatever concurrent sessions appended after that
   snapshot ���?" the write-back succeeds, the victim gets no error, and the
   loss is invisible. This has happened in production: a parallel session's
   write-back erased two entries appended minutes earlier, hours after the
   exact failure mode had been documented. So: take the snapshot, prepare
   the mutation, then ���?" immediately before writing ���?" re-read the live log
   and diff against the snapshot. If new entries appeared, merge them into
   the write-back (or rebuild from the fresh read). Never write back a
   stale snapshot.

2. **Isolate the target entry, or anchor to a single line.** Either split
   the log on `### Observation N:` headers, edit the TARGET entry's chunk in
   isolation, and reassemble ���?" OR, for a status-only edit, use a strictly
   line-anchored multiline substitution that cannot cross a newline, e.g.
   `re.sub(r'(?m)^(\s*-?\s*)\*\*Status:\*\*.*$', ...)` (multiline `^...$`
   bounds the match to one line). NEVER use a DOTALL/greedy pattern across
   the multi-entry file.

3. **Assert a structural invariant against the LIVE pre-write file.** Count
   `### Observation` headers in the live file immediately before writing and
   again after. For a status-only edit the count MUST be unchanged; for
   archival or append it must change by exactly the expected number. The
   baseline must be the live file at write time, NOT your session's earlier
   snapshot ���?" an invariant computed against a stale snapshot validates that
   you wrote what you intended while still destroying what others wrote in
   between. Fail loudly if the count is off.

4. **Keep the pre-write backup.** Copy `log.md` before any programmatic
   mutation. This is what made full recovery trivial when the truncation
   above occurred ���?" it turned a destructive bug into a non-event.

5. **Verify your entries SURVIVED, not just that they were written.** A
   successful append proves nothing an hour later ���?" a concurrent session's
   write-back can silently delete it, and only the destroying session gets
   any signal (none). Before surfacing observations at session end, grep
   the log for every entry number this session wrote and confirm each still
   exists exactly once; re-append any that are missing (with fresh numbers)
   and log a meta-observation about the collision.

Principle: a log shared across many entries must be mutated one bounded
entry at a time; every rewrite must be based on a fresh read, verified by a
structural invariant against the live pre-write file, and backed up. Writers
must verify survival, not just successful writes ���?" in a concurrent erase,
the victim gets no error.

**Format and insertion:** always `### Observation NNN:`, always appended to
the END of the log, never mid-file, never alternative ID formats. One
format, one insertion point. **Every new observation MUST include
`**Status:** OPEN` as its first field ���?" this is mandatory at write time, not
optional.** Reviews classify entries by their Status line; an observation
written without one is invisible to any status-filtered pass and risks being
silently skipped instead of triaged.

```markdown
### Observation [N]: [Short descriptive title]

**Status:** OPEN
**Date:** [date]
**Session context:** [what task was being worked on]
**Skill:** [existing skill name, or "New skill candidate: [working name]"]
**Type:** [open-source | internal]
**Phase/Area:** [which part of the skill or workflow]

**Issue:** [What happened ���?" specific enough to understand weeks later
without the original conversation.]

**Suggested improvement:** [Concrete change. For existing skills, name the
section or rule; for new skills, scope and key components.]

**Principle:** [The generalisable takeaway ���?" the most important field.]
```

**Context preservation:** if an observation depends on session-local data
(uploads, API output), save that context into the workspace first and add a
`**Reference file:**` line ���?" an observation whose evidence dies with the
session is incomplete.

**Confidentiality at logging time:** for `type: open-source` observations,
the Issue/Improvement fields may reference specifics for context, but the
Principle must be fully generalised ���?" no client names, domains, or details
traceable to a real project. Full confidentiality layers for skill
authoring: `references/skill-authoring.md`.

## Referencing Observations

When citing an observation by number ���?" in conversation, in a review report,
or from within another observation ���?" the number must come from the entry's
literal `### Observation N:` header line. Never cite an observation number
that wasn't read from that header.

- **Search-tool line numbers are positional metadata, not IDs.** `grep -n`
  prefixes every match with a line number; when a match lands mid-entry
  (e.g., on a Session context or Principle line rather than the header),
  that line number is NOT the observation number. Resolve to the owning
  header first ���?" scan backwards from the matched line to the nearest
  preceding `### Observation N:` header and take the number from there
  (e.g., an awk backwards-scan, or re-grep for `^### Observation` and pick
  the last header line before the match).
- **Plausibility check (cheap second layer):** before quoting any
  observation number, compare it against the known counter range ���?" the
  highest `### Observation N:` header in the log. A number outside that
  range (e.g., citing #1365 when the log's counter is at #766) is almost
  certainly a line number or other positional artefact misread as an ID.

The general rule: IDs must come from the record's own identifier field,
never from the positional metadata of the search tool that found it.

## Taxonomy (quick version)

**Open-source** ���?" client-agnostic, methodology-driven, useful to other
practitioners. **Internal** ���?" contains user/client/project specifics or
personal preferences. Default to open-source when it could go either way,
stripping specifics. The boundary is also a confidentiality boundary. Full
requirements (attribution, licensing, structure): `references/skill-authoring.md`.

## Archival on Write

On every log write, first move already-resolved entries to
`skill-observations/archive/log-[YYYY-MM-DD].md` (preserving the log header
in the archive). "Already resolved" is decided by date, read from the file:
a resolved status MUST record its date ���?" `ACTIONED (YYYY-MM-DD) ���?" [what was
done]` / `DECLINED (YYYY-MM-DD) ���?" [reason]` ���?" and archival moves only
entries whose recorded date is before today. Entries resolved today stay in
the active log until the next day, no matter which session resolved them:
the grace period lives in the file, never in session memory, so it holds
across parallel and subsequent sessions. A resolved entry with no readable
date gets today's date added instead of being archived. The active log
keeps its header, status key, all OPEN entries, and the same-day-resolved
ones.

Archival is a read-filter-rewrite ���?" the highest-risk mutation the log
undergoes, and the one that has destroyed concurrent appends in production.
It MUST follow the full Log-write safety sequence above: backup, re-read
the live log immediately before writing back and merge any entries that
appeared since the snapshot, then verify the post-write header count equals
the live pre-write count minus exactly the number of archived entries.

## Log Structure

```markdown
# Skill Observation Log

Observations captured during task-oriented work.

**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill
updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue ���?"
resolved statuses always carry their resolution date

---

## [Date]

### Observation 1: [Title]
**Status:** OPEN
[... full format ...]
```

## Surfacing Protocol

Default: at end of session, as a grouped summary ���?" improvements grouped by
skill, new-skill candidates listed separately; for each, one sentence plus
suggested type; ask which to act on. Surface earlier when an observation
needs user input to be complete, when a skill is actively producing wrong
output, or when observations cluster on one skill.

**Default to log-and-defer.** Surfacing an observation is not an invitation
to act on it. The default is log-and-defer: state that the observation is
logged for the next review, and stop. Reserve in-session application
strictly for the two triggers already defined under "Acting on
Observations" ���?" an explicit user request that names the action, or
correcting a skill that is producing wrong output in the current session.

Do NOT routinely offer a binary "apply now vs leave for next review" choice
when surfacing observations. For users who run regular reviews, that offer is
unwanted friction repeated every session. If a user has expressed a standing
preference to always defer to the next review, suppress the in-session
"act now?" offer entirely rather than asking each time.

**Self-check before surfacing:** observations were logged throughout the
whole session (including discussion phases); logged silently; each follows
Issue ���+' Improvement ���+' Principle; each is typed; existing-skill items name
the section; no open-source Principle contains client-identifying info;
every appended observation carries a Status line (`**Status:** OPEN` at
write time) ���?" a statusless entry is invisible to any status-filtered review
pass, so if any observation lacks one, add it now. Finally, run the
survival check (Log-write safety rule 5): grep the log for every entry
number this session wrote and confirm each still exists exactly once ���?" a
concurrent session's write-back deletes silently. Fix failures before
surfacing.

## Acting on Observations

Act only in three contexts: (1) the comprehensive review (load
`references/weekly-review.md`); (2) an explicit user request ("update X
skill", "act on observation #N"); (3) in-session correction when a skill is
producing wrong output the user should know about. Otherwise: log, don't
act.

When acting: small, clearly-additive, low-risk changes (a new rule, a
clarification, a factual fix) may be applied directly. Substantial changes
(restructuring, new capabilities, changed methodology) and all new-skill
creation: load `references/skill-authoring.md` first and follow its editing
and staging rules. If an observation reveals a principle that applies to
skills generally, propose it for the cross-cutting principles file (see the
same reference).

## Quick Reference

| Question | Answer |
|----------|--------|
| When do I observe? | The whole session, including feedback and reflection phases |
| How do I log? | Silently, immediately, appended to the end, with the 3-step numbering discipline |
| When do I surface? | End of session, or earlier if needed |
| Status line? | Mandatory `**Status:** OPEN` as the first field of every new observation; reviews treat statusless entries as OPEN, never as nonexistent |
| Citing an observation number? | Only from its literal `### Observation N:` header ���?" `grep -n` line numbers are positional metadata, not IDs; sanity-check against the known counter range |
| Open-source or internal? | Default open-source; the boundary is confidential |
| Small fix or substantial? | Additive ���+' apply directly; restructuring/new skill ���+' `references/skill-authoring.md` |
| Rewriting the log (archival/renumber/status)? | Backup ���+' re-read live and merge ���+' bounded mutation ���+' verify count against live pre-write file ���+' confirm own entries survived |
| Weekly review? | Trigger check at session start; procedure in `references/weekly-review.md` |
| No filesystem? | Handoff-doc mode ���?" `references/environments.md` |

hook: PostToolUse
 succeeded in 1056ms:
---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

## Overview

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

## Red Flags - STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!", etc.)
- About to commit/push/PR without verification
- Trusting agent success reports
- Relying on partial verification
- Thinking "just this once"
- Tired and wanting work over
- **ANY wording implying success without having run verification**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ���%��� evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter ���%��� compiler |
| "Agent said success" | Verify independently |
| "I'm tired" | Exhaustion ���%��� excuse |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Key Patterns

**Tests:**
```
���o. [Run test command] [See: 34/34 pass] "All tests pass"
���?O "Should pass now" / "Looks correct"
```

**Regression tests (TDD Red-Green):**
```
���o. Write ���+' Run (pass) ���+' Revert fix ���+' Run (MUST FAIL) ���+' Restore ���+' Run (pass)
���?O "I've written a regression test" (without red-green verification)
```

**Build:**
```
���o. [Run build] [See: exit 0] "Build passes"
���?O "Linter passed" (linter doesn't check compilation)
```

**Requirements:**
```
���o. Re-read plan ���+' Create checklist ���+' Verify each ���+' Report gaps or completion
���?O "Tests pass, phase complete"
```

**Agent delegation:**
```
���o. Agent reports success ���+' Check VCS diff ���+' Verify changes ���+' Report actual state
���?O Trust agent report
```

## When To Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction
- ANY positive statement about work state
- Committing, PR creation, task completion
- Moving to next task
- Delegating to agents

**Rule applies to:**
- Exact phrases
- Paraphrases and synonyms
- Implications of success
- ANY communication suggesting completion/correctness

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/gate-check.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/gate-selftest.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'docs/evidence/2026-10-26-f3-data-real-guard.md' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/data-real-guard.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/data-real-guard-selftest.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/README.md' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 731ms:
   1: /* node tools/gate-check.js <EV> --stage before|final [--no-git]
   2:    Checks the gate evidence doc: summaries derived from the score lines, the keep rule, the REASON text, prediction order, git state. */
   3: const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
   4: const a = process.argv.slice(2);
   5: const stage = a.indexOf('--stage') >= 0 ? a[a.indexOf('--stage') + 1] : '';
   6: const noGit = a.includes('--no-git');
   7: const file = a.find((x, i) => !x.startsWith('--') && a[i - 1] !== '--stage');
   8: if (!file || !['before', 'final'].includes(stage)) { console.log('usage: gate-check.js <EV> --stage before|final [--no-git]'); process.exit(2); }
   9: const root = path.join(__dirname, '..');
  10: const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  11: const get = (tag) => {
  12:   const i = lines.findIndex((l) => l.startsWith(tag));
  13:   return i < 0 ? null : { i, v: lines[i].slice(tag.length).trim() };
  14: };
  15: const bad = [];
  16: // always, even with --no-git: real data must never be tracked (studio-harness F3)
  17: const real = require('./data-real-guard.js').trackedReal(root);
  18: if (!real.ok) bad.push(real.error);
  19: else if (real.files.length) bad.push('data/real is tracked by git: ' + real.files.join(', '));
  20: function parse(text) {
  21:   const m = (re) => { const x = re.exec(text); return x ? +x[1] : NaN; };
  22:   const s = /split: right feature first (\d+) of (\d+)/.exec(text);
  23:   const r = { R: s ? +s[1] : NaN, F: s ? +s[2] : NaN, W: m(/wrong card (\d+)/), N: m(/no card where one fits (\d+)/), K: m(/card on a not-a-fit prompt (\d+)/) };
  24:   return Object.values(r).some(Number.isNaN) ? null : r;
  25: }
  26: const derived = (x) => `feature ${x.R} of ${x.F}, wrong ${x.W}, no card ${x.N}, not-a-fit ${x.K}`;
  27: function side(lineTag, sumTag) {
  28:   const L = get(lineTag), S = get(sumTag);
  29:   if (!L) { bad.push('missing ' + lineTag); return null; }
  30:   const p = parse(L.v);
  31:   if (!p) { bad.push(lineTag + ' lacks the score numbers'); return null; }
  32:   if (!S) bad.push('missing ' + sumTag);
  33:   else if (S.v !== derived(p)) bad.push(`${sumTag} should be "${derived(p)}"`);
  34:   return { p, L };
  35: }
  36: const base = get('BASE-SHA:');
  37: if (!base || !base.v) bad.push('missing BASE-SHA:');
  38: const b = side('BEFORE-LINE:', 'BEFORE:');
  39: const pm = get('PREDICTION-PM:'), lead = get('PREDICTION-LEAD:');
  40: if (!pm) bad.push('missing PREDICTION-PM:');
  41: if (!lead) bad.push('missing PREDICTION-LEAD:');
  42: const outcome = get('OUTCOME:'), reason = get('REASON:');
  43: let a1 = null;
  44: const finalOutcome = outcome ? outcome.v : 'pending';
  45: if (b) {
  46:   const N0 = b.p.N, inconclusive = N0 < 6;
  47:   if (inconclusive) {
  48:     if (!outcome || outcome.v !== 'inconclusive') bad.push('before no-card < 6: OUTCOME must be inconclusive');
  49:     if (!reason || reason.v !== `before no-card < 6 (${N0})`) bad.push(`REASON must be "before no-card < 6 (${N0})"`);
  50:   }
  51:   if (stage === 'final') {
  52:     if (inconclusive) {
  53:       if (get('AFTER-LINE:') || get('AFTER:')) bad.push('inconclusive run must have no AFTER-LINE or AFTER:');
  54:     } else {
  55:       a1 = side('AFTER-LINE:', 'AFTER:');
  56:       if (!outcome || !['kept', 'reverted'].includes(outcome.v)) bad.push('OUTCOME must be kept or reverted');
  57:       const al = get('AFTER-LINE:');
  58:       if (al && pm && lead && (pm.i > al.i || lead.i > al.i)) bad.push('PREDICTION lines must come before AFTER-LINE');
  59:       if (a1) {
  60:         const x = b.p, y = a1.p, why = [];
  61:         if (!(x.N - y.N >= 2)) why.push(`no-card fall < 2 (${x.N} to ${y.N})`);
  62:         if (!(y.W <= x.W)) why.push(`wrong card rose (${x.W} to ${y.W})`);
  63:         if (!(y.K <= x.K)) why.push(`not-a-fit card rose (${x.K} to ${y.K})`);
  64:         const kept = why.length === 0, want = kept ? 'none' : why.join(' and ');
  65:         if (outcome && outcome.v !== (kept ? 'kept' : 'reverted')) bad.push(`OUTCOME should be ${kept ? 'kept' : 'reverted'}`);
  66:         if (!reason || reason.v !== want) bad.push(`REASON should be "${want}"`);
  67:         const pr = get('PREDICTION:');
  68:         if (!pr || pr.v !== (kept ? 'held' : 'did not hold')) bad.push(`PREDICTION: should be "${kept ? 'held' : 'did not hold'}"`);
  69:       }
  70:     }
  71:   }
  72: }
  73: if (!noGit && base && base.v && !bad.length) {
  74:   const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8' }).status;
  75:   const sha = base.v, mf = path.join(root, 'tests/match-frozen.js');
  76:   const same = run('git', ['diff', '--quiet', sha, 'HEAD', '--', ':(top)fit-finder/engine/fit.js']) === 0;
  77:   if (finalOutcome === 'kept') {
  78:     if (same) bad.push('kept but engine/fit.js equals BASE');
  79:     if (run('node', [mf, '--base', sha, '--allow', 'engine']) !== 0) bad.push('match-frozen --allow engine fails');
  80:     if (run('node', [mf, '--base', sha]) === 0) bad.push('match-frozen passes without --allow engine');
  81:   } else {
  82:     if (!same) bad.push('engine/fit.js differs from BASE but outcome is ' + finalOutcome);
  83:     if (run('node', [mf, '--base', sha]) !== 0) bad.push('match-frozen --base fails');
  84:   }
  85: }
  86: if (bad.length) { console.log('gate-check FAIL: ' + bad.join('; ')); process.exit(1); }
  87: const f = (t, x) => `${t} feature ${x.R} of ${x.F} wrong ${x.W} no-card ${x.N} not-a-fit ${x.K}`;
  88: console.log(`gate-check ok ${stage} ${finalOutcome}; ${f('before', b.p)}` + (a1 ? `; ${f('after', a1.p)}` : ''));

hook: PostToolUse
 succeeded in 722ms:
   1: /* node tools/gate-selftest.js : exercises gate-check.js (--no-git, plus one git-mode engine-diff case) and engine-scope.js. Prints gate-selftest ok or the first failure. */
   2: const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
   3: const root = path.join(__dirname, '..');
   4: const gc = path.join(__dirname, 'gate-check.js');
   5: const es = require('./engine-scope.js');
   6: const fail = (m) => { console.log('gate-selftest FAIL: ' + m); process.exit(1); };
   7: const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-selftest-'));
   8: let n = 0;
   9: 
  10: // a score line; `cr` is the "first card right" number (differs from the split number on purpose)
  11: const line = (R, F, W, N, K, cr) => `first card right: ${cr === undefined ? R + 3 : cr} of ${F + 4} that fit; wrong card ${W} (a); no card where one fits ${N} (b); card on a not-a-fit prompt ${K} (c); fit agreement 12 of 29; score 5; split: right feature first ${R} of ${F}, rightly none 3 (x)`;
  12: const sum = (tag, R, F, W, N, K) => `${tag} feature ${R} of ${F}, wrong ${W}, no card ${N}, not-a-fit ${K}`;
  13: function doc(o) {
  14:   const b = o.b || [17, 29, 2, 8, 0], a = o.a;
  15:   const L = ['BASE-SHA: ' + (o.sha || 'ae60341'), 'BEFORE-LINE: ' + line(...b), o.beforeSum || sum('BEFORE:', ...b)];
  16:   if (!o.noPred) { if (!o.pmLate) L.push('PREDICTION-PM: x'); L.push('PREDICTION-LEAD: y'); }
  17:   if (o.outcome && !a) L.push('OUTCOME: ' + o.outcome);
  18:   if (o.reason) L.push('REASON: ' + o.reason);
  19:   if (a) {
  20:     L.push('AFTER-LINE: ' + line(...a), o.afterSum || sum('AFTER:', ...a));
  21:     if (o.pmLate) L.push('PREDICTION-PM: x');
  22:     L.push('OUTCOME: ' + o.outcome, 'REASON: ' + o.reason);
  23:     if (o.pred) L.push('PREDICTION: ' + o.pred);
  24:   }
  25:   return L.join('\n') + '\n';
  26: }
  27: function run(stage, o, git) {
  28:   const f = path.join(dir, 'ev' + (n++) + '.md');
  29:   fs.writeFileSync(f, doc(o));
  30:   const r = spawnSync('node', [gc, f, '--stage', stage].concat(git ? [] : ['--no-git']), { encoding: 'utf8' });
  31:   return git ? r : r.status === 0;
  32: }
  33: const ok = (name, stage, o) => { if (!run(stage, o)) fail(name + ' should pass'); };
  34: const bad = (name, stage, o) => { if (run(stage, o)) fail(name + ' should fail'); };
  35: 
  36: ok('before', 'before', {});
  37: bad('before N0=5 no outcome', 'before', { b: [17, 29, 2, 5, 0] });
  38: ok('before N0=5 inconclusive', 'before', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
  39: bad('before N0=5 wrong reason', 'before', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'none' });
  40: ok('final N0=5 inconclusive', 'final', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
  41: bad('final N0=5 with after', 'final', { b: [17, 29, 2, 5, 0], a: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
  42: 
  43: const B = [17, 29, 2, 8, 0];
  44: ok('kept', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'held' });
  45: bad('kept pred did not hold', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'did not hold' });
  46: ok('reverted N', 'final', { b: B, a: [20, 29, 2, 7, 0], outcome: 'reverted', reason: 'no-card fall < 2 (8 to 7)', pred: 'did not hold' });
  47: bad('kept when N fell 1', 'final', { b: B, a: [20, 29, 2, 7, 0], outcome: 'kept', reason: 'none', pred: 'held' });
  48: ok('reverted W', 'final', { b: B, a: [20, 29, 3, 5, 0], outcome: 'reverted', reason: 'wrong card rose (2 to 3)', pred: 'did not hold' });
  49: ok('reverted K', 'final', { b: B, a: [20, 29, 2, 5, 1], outcome: 'reverted', reason: 'not-a-fit card rose (0 to 1)', pred: 'did not hold' });
  50: const all = [20, 29, 3, 8, 1], r1 = 'no-card fall < 2 (8 to 8)', r2 = 'wrong card rose (2 to 3)', r3 = 'not-a-fit card rose (0 to 1)';
  51: ok('all three', 'final', { b: B, a: all, outcome: 'reverted', reason: [r1, r2, r3].join(' and '), pred: 'did not hold' });
  52: bad('middle missing', 'final', { b: B, a: all, outcome: 'reverted', reason: [r1, r3].join(' and '), pred: 'did not hold' });
  53: bad('first two swapped', 'final', { b: B, a: all, outcome: 'reverted', reason: [r2, r1, r3].join(' and '), pred: 'did not hold' });
  54: bad('PM after AFTER-LINE', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'held', pmLate: true });
  55: bad('summary disagrees', 'final', { b: B, a: [20, 29, 2, 6, 0], afterSum: sum('AFTER:', 21, 29, 2, 6, 0), outcome: 'kept', reason: 'none', pred: 'held' });
  56: bad('summary from first card right', 'final', { b: B, a: [20, 29, 2, 6, 0, 24], afterSum: sum('AFTER:', 24, 33, 2, 6, 0), outcome: 'kept', reason: 'none', pred: 'held' });
  57: ok('summary from split with differing first-card number', 'final', { b: B, a: [20, 29, 2, 6, 0, 24], outcome: 'kept', reason: 'none', pred: 'held' });
  58: 
  59: // git mode: engine/fit.js at BASE must be compared with HEAD (was a doubled path, always 'same')
  60: const gr = run('before', { sha: '23757a5' }, true);
  61: if (!/engine\/fit\.js differs from BASE/.test(gr.stdout)) fail('git mode: BASE with a different engine/fit.js should report that it differs; got: ' + gr.stdout.trim());
  62: 
  63: // engine-scope
  64: const base = fs.readFileSync(path.join(root, 'engine/fit.js'), 'utf8').replace(/\r\n/g, '\n');
  65: const crlf = (s) => s.replace(/\n/g, '\r\n');
  66: const once = (s, a, b) => { const i = s.indexOf(a); if (i < 0) fail('anchor missing: ' + a); return s.slice(0, i) + b + s.slice(i + a.length); };
  67: const opsAt = base.indexOf('    READ: /') + 11;
  68: const gateAt = base.indexOf('    let fit;\n') + 14;
  69: const inOps = base.slice(0, opsAt) + '  ' + base.slice(opsAt);              // a changed char inside OPS
  70: const inGate = base.slice(0, gateAt) + ' ' + base.slice(gateAt);              // a changed char inside the gate block
  71: const step = /STEP/.test(base) ? once(base, 'STEP', 'STEq') : fail('no STEP label in engine');
  72: const expect = (name, got, empty) => { if (!!got.length === empty) fail('engine-scope ' + name + (empty ? ' should be empty: ' + got.join('; ') : ' should fail')); };
  73: expect('same', es.check(base, base), true);
  74: expect('ops change', es.check(base, inOps), true);
  75: expect('gate change', es.check(base, inGate), true);
  76: expect('STEP change', es.check(base, step), false);
  77: const km = base.match(/^\s{4}([A-Z]+):/m)[1];
  78: expect('deleted key', es.check(base, once(base, '    ' + km + ':', '    ' + km.toLowerCase() + 'x:')), false);
  79: expect('Date in OPS', es.check(base, base.slice(0, opsAt) + '/*Date.now()*/' + base.slice(opsAt)), false);
  80: expect('crlf vs lf', es.check(crlf(base), base), true);
  81: const mixed = (s) => s.split('\n').map((l, i, all) => i % 2 && i < all.length - 1 ? l + '\r' : l).join('\n');
  82: expect('lf vs mixed ops change', es.check(base, mixed(inOps)), true);
  83: expect('mixed STEP', es.check(base, mixed(step)), false);
  84: console.log('gate-selftest ok');

hook: PostToolUse
 succeeded in 700ms:
   1: # F3 (Fit Finder half): the done check fails when data/real is tracked
   2: 
   3: studio-harness F3 (premortem 7): "the Fit Finder done check fails if data/real is git-tracked". Branch `harness/f3-data-real-guard`, based on `prompt-coach` fb26061. Run 2026-10-26 ~01:05Z on Ian's PC.
   4: 
   5: ## What changed
   6: 
   7: - `fit-finder/tools/data-real-guard.js`: runs `git ls-files -- data/real` from `fit-finder/`; exit 1 if it lists anything, and exit 1 if git itself fails (fails closed). Lists paths only, never reads the files.
   8: - `fit-finder/tools/gate-check.js` (the Fit Finder done/gate check) calls it on every run, even with `--no-git`, and adds `data/real is tracked by git: <paths>` to its FAIL reasons.
   9: - `fit-finder/tools/data-real-guard-selftest.js`: test, written first. A throwaway git repo shaped like workiva gets copies of the real `gate-check.js` and `data-real-guard.js` and one fake file `fit-finder/data/real/fake.jsonl`. The real `data/real` is never opened.
  10: - `fit-finder/tools/README.md`: the gate-check row names the new failure; one row for the guard and its selftest.
  11: 
  12: Choice logged: Fit Finder has no GOAL.md done line, so "the done check" is taken to be `tools/gate-check.js`, the only gate check script, and the guard is also runnable alone.
  13: 
  14: ## Test run (commands from `fit-finder/`)
  15: 
  16: Red 1, guard not written: `node tools/data-real-guard-selftest.js` -> exit 1, `ENOENT ... copyfile ...tools\data-real-guard.js`.
  17: 
  18: Red 2, guard written but not called by gate-check (the join):
  19: ```
  20: data-real-guard-selftest FAIL: tracked gate: want exit 1 matching /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/, got 0: gate-check ok before pending; before feature 17 of 29 wrong 2 no-card 8 not-a-fit 0
  21: exit 1
  22: ```
  23: 
  24: Green, after the call in gate-check:
  25: ```
  26: ## data-real-guard-selftest
  27: data-real-guard-selftest ok (7 checks)
  28: exit 0
  29: ## gate-selftest
  30: gate-selftest ok
  31: exit 0
  32: ## data-real-guard on this checkout
  33: data-real-guard ok
  34: exit 0
  35: ```
  36: 
  37: The 7 checks: untracked file on disk passes (guard, gate); `git add -f` of the fake file fails (guard and gate, each naming the path; `trackedReal` lists exactly it); `git rm --cached` passes again; outside any repo the guard fails closed (`git ls-files failed`). On this checkout nothing under `data/real` is tracked.

hook: PostToolUse
 succeeded in 701ms:
   1: /* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
   2:    Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed). */
   3: const { spawnSync } = require('child_process');
   4: function trackedReal(dir) {
   5:   const r = spawnSync('git', ['ls-files', '--', 'data/real'], { cwd: dir, encoding: 'utf8' });
   6:   if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
   7:   return { ok: true, files: r.stdout.split(/\r?\n/).filter(Boolean) };
   8: }
   9: module.exports = { trackedReal };
  10: if (require.main === module) {
  11:   const t = trackedReal(process.cwd());
  12:   if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
  13:   if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
  14:   console.log('data-real-guard ok');
  15: }

hook: PostToolUse
 succeeded in 749ms:
   1: /* node tools/data-real-guard-selftest.js : exercises data-real-guard.js and its call from gate-check.js in a throwaway git repo
   2:    (fake files only; the real data/real is never read). Prints data-real-guard-selftest ok or the first failure. */
   3: const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
   4: const fail = (m) => { console.log('data-real-guard-selftest FAIL: ' + m); process.exit(1); };
   5: const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-real-guard-'));
   6: const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
   7: 
   8: // throwaway repo shaped like workiva: <repo>/fit-finder/tools/{gate-check,data-real-guard}.js copied from this checkout
   9: const repo = path.join(tmp, 'repo'), ff = path.join(repo, 'fit-finder');
  10: fs.mkdirSync(path.join(ff, 'tools'), { recursive: true });
  11: fs.mkdirSync(path.join(ff, 'data', 'real'), { recursive: true });
  12: for (const f of ['gate-check.js', 'data-real-guard.js']) fs.copyFileSync(path.join(__dirname, f), path.join(ff, 'tools', f));
  13: if (git(repo, 'init', '-q').status !== 0) fail('git init');
  14: fs.writeFileSync(path.join(ff, 'data', 'real', 'fake.jsonl'), '{"fake":"not real data"}\n');
  15: fs.writeFileSync(path.join(ff, 'README.md'), 'x\n');
  16: git(repo, 'add', 'fit-finder/README.md');
  17: 
  18: // a valid before-stage evidence doc (no-card 8, so no OUTCOME needed)
  19: const line = 'first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits 8 (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)';
  20: const ev = path.join(tmp, 'ev.md');
  21: fs.writeFileSync(ev, ['BASE-SHA: ae60341', 'BEFORE-LINE: ' + line, 'BEFORE: feature 17 of 29, wrong 2, no card 8, not-a-fit 0', 'PREDICTION-PM: x', 'PREDICTION-LEAD: y'].join('\n') + '\n');
  22: const gate = () => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8' });
  23: const guard = (cwd) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp } });
  24: let n = 0;
  25: const expect = (name, r, code, re) => {
  26:   n++;
  27:   if (r.status !== code || !re.test(r.stdout)) fail(`${name}: want exit ${code} matching ${re}, got ${r.status}: ${(r.stdout + r.stderr).trim()}`);
  28: };
  29: 
  30: // 1-2. control: data/real exists on disk but is untracked, so guard and done check pass
  31: expect('untracked guard', guard(ff), 0, /^data-real-guard ok/);
  32: expect('untracked gate', gate(), 0, /^gate-check ok before/);
  33: 
  34: // 3-5. tracked: git add a file under data/real, and both fail naming it
  35: git(repo, 'add', '-f', 'fit-finder/data/real/fake.jsonl');
  36: expect('tracked guard', guard(ff), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
  37: expect('tracked gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
  38: const { trackedReal } = require(path.join(ff, 'tools', 'data-real-guard.js'));
  39: const t = trackedReal(ff);
  40: if (!t.ok || t.files.join() !== 'data/real/fake.jsonl') fail('trackedReal lists ' + JSON.stringify(t));
  41: n++;
  42: 
  43: // 6. untrack again: passes again
  44: git(repo, 'rm', '-q', '--cached', 'fit-finder/data/real/fake.jsonl');
  45: expect('untracked again gate', gate(), 0, /^gate-check ok before/);
  46: 
  47: // 7. fails closed outside a git repo (git ls-files errors)
  48: const bare = path.join(tmp, 'not-a-repo');
  49: fs.mkdirSync(bare);
  50: expect('no repo guard', guard(bare), 1, /data-real-guard FAIL: git ls-files failed/);
  51: 
  52: fs.rmSync(tmp, { recursive: true, force: true });
  53: console.log(`data-real-guard-selftest ok (${n} checks)`);

hook: PostToolUse
 succeeded in 940ms:
   1: # fit-finder/tools
   2: 
   3: Small scripts for the BCA run. Run them from `fit-finder/` (paths are relative to where you run them). Every script exits non-zero on a problem. `node tools/selftest.js` exercises all of them on `tools/fixtures/` and prints `selftest ok`.
   4: 
   5: `L` below is the run ledger `<repo root>/.ledger/2026-10-22-fit-finder-bca` (git-ignored; the env var `FF_LEDGER` overrides it, used by the self-test only).
   6: 
   7: | Script | Arguments | Prints | Exit |
   8: |---|---|---|---|
   9: | `check-set.js` | `<prompts> <gold\|-> <catalogue> [--not-range LO HI]` | `rows N, per area FR a GRC b SUS c GEN d, gold M, not K, unknown cards U` | 1 on 0 rows, a row lacking string `id`/`task`, a repeated id, an `area` not in FR/GRC/SUS/GEN. With gold: a missing or extra gold id, `fit` not good/partial/not, `cards` not an array, a `not` row with cards, a card id not in the catalogue; with `--not-range`, K outside LO..HI |
  10: | `nearcopy.js` | `<fresh> <real dir> [--catalogue <catalogue>]` | `files read F, rows read R, windows W`, `control: hit`, then `hits: none` or `hits: <fresh ids>`. Never prints text | 1 if F, R or W is 0, the positive control misses, or any hit. 5-word windows over every string value of every real row; with `--catalogue` a fresh row also hits on a window shared with any card's `try` |
  11: | `agree.js` | `<frozen> <final>` | `N <n> D <d> agreement <pct> PASS\|FAIL` | 1 if an id set differs, a differing row (fit or sorted cards) lacks `"by":"ian"`, an unchanged row has it, or (N-D)/N < 0.845 (N=40: D <= 6) |
  12: | `card-view.js` | `<catalogue> <out>` | `cards N` | writes `{"useCases":[...]}` with every card minus `match` and `ops` (`try` kept) |
  13: | `label-sheet.js` | `<draft> <card-view> <out>`; or `--verify <sheet> <draft> <catalogue>` | `label-sheet rows N`; or `label-sheet ok` | 1 on bad input; `--verify` rebuilds the sheet from the draft and catalogue and needs a byte-for-byte match |
  14: | `label-handoff.js` | `[--check] <looks file> <sheet> <ian batch json> <catalogue> <out frozen> <out gold>` | `label-handoff ok rows N changed D`, or `STOP: <reason>` | 3 on any `STOP`. `--check` recomputes both outputs in memory and exits 1 unless they equal the files byte for byte |
  15: | `score-once.js` | `<name> <prompts> <gold> [--scorer <path>]` | the scorer's stdout (from `L/score-<name>.out` on a repeat) | the scorer's status. 3 with `STOP: unknown outcome` if `L/score-<name>.started` exists without `.out` |
  16: | `keep-check.js` | `<EV>` | `keep-check ok <outcome>` | 1 if the rule, the written REASON or the git state disagree |
  17: | `ops-check.js` | `<base sha>` | `ops-check ok <n> cards changed` | 1 on any violation |
  18: | `diag-nocard.js`, `diag-selftest.js` | `[--engine <path>]` (self-test only); selftest: none (needs `FF_LEDGER`) | `diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K`; selftest `diag-selftest ok` | 1 with `INVALID: ...` if tune wrong > 4, tune not-a-fit > BASE_K or half A wrong > 0; 2 on bad input. Reads only the tune set and half A |
  19: | `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees, or (always, even with `--no-git`) git tracks anything under `data/real` |
  20: | `data-real-guard.js`, `data-real-guard-selftest.js` | none | `data-real-guard ok` / `data-real-guard FAIL: data/real is tracked by git: <paths>`; `data-real-guard-selftest ok (7 checks)` | 1 if `git ls-files -- data/real` lists anything or itself fails; lists paths only, never reads the files. The selftest uses a throwaway repo with a fake file |
  21: | `engine-scope.js`, `gate-selftest.js` | `--git <sha>` or `--files <base> <new>`; selftest: none | `engine-scope ok` / `engine-scope FAIL: <problems>`; `gate-selftest ok` | 1 if `engine/fit.js` differs from the base outside the `OPS` block and the `let fit;`..`return { fit,` gate block (line endings ignored), an OPS key changed, or an added line has Date/performance/location/http/fetch/require(/process |
  22: | `selftest.js` | none | `selftest ok` or `selftest FAIL: ...` | 1 on the first failure |
  23: 
  24: ## Details
  25: 
  26: **label-handoff.** The PICK is ONE line of space-separated `<id>=<label>` tokens after a `PICK` marker (on the same line, or the next non-empty line). Labels: a catalogue card id, `none`, `not`. Every sheet id (`### <id> | <area>` headings) appears exactly once. The batch needs a non-empty `words`, a boolean `accepted`, `sheetSha256` equal to the sheet's sha256 (and the sheet must match `L/label-sheet.sha256` if that exists), `changes[].id` in the sheet with a legal `label`, and empty `changes` when `accepted` is true. Frozen rows: `{"id","fit","cards","by":"pm"}` (card id: `good` + `[id]`; `none`: `good` + `[]`; `not`: `not` + `[]`). Gold = frozen with the changes applied and `"by":"ian"` on exactly the changed rows (a change equal to the PM label is ignored).
  27: 
  28: **score-once.** Runs `node tests/synth-score.js <prompts> <gold>` from `fit-finder/` (or `--scorer`, self-test only) at most once per `<name>`. First call: writes `.started`, runs, writes `.out` atomically (first line `STATUS <n>`, then stdout), prints stdout, exits with the scorer's status. Later calls print the saved stdout and exit with the saved status without running anything. Fresh/holdout/blind lines are copied only from `L/score-<name>.out`.
  29: 
  30: **keep-check.** Reads `BEFORE-LINE`, `AFTER-LINE`, `OUTCOME`, `REASON` from the evidence doc; R = number after `right feature first `, S = number after `score `. Kept iff R1 >= R0 + 1 and S1 <= S0. REASON must be `none` (kept) or `R gain < 1 (R0 to R1)` / `S rose (S0 to S1)` / `R gain < 1 and S rose (R0 to R1; S0 to S1)`. Git check against the commit whose subject starts `task 11:`: reverted needs `node tests/match-frozen.js --base <sha>` to pass; kept needs it to pass with `--allow ops` and fail without.
  31: 
  32: **ops-check.** Compares `data/catalogue.json` at `<base sha>` with the working tree: same cards in the same order, every field except `ops` equal, each `ops` starts with the old `ops` (append only), every added value is in `AI_OPS` (`engine/fit.js`, the list `tests/catalogue.test.js` checks), and at least one card changed.

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
About 11 minutes left. The guard runs before the stage, outcome, and `--no-git` branches, and a guard failure stays in the final failure list. The new selftest exercises the actual gate script in a fake repo. I�?Tll now check whether Git can select the wrong index or miss tracked paths.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath "C:/Users/teasp/.codex/plugins/cache/superpowers-marketplace/superpowers/7.0.1/skills/using-superpowers/references/codex-tools.md"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node fit-finder/tools/data-real-guard-selftest.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git log -1 --format=fuller d007e0b' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 exited 1 in 478ms:
node:fs:3600
  return binding.mkdtemp(prefix, options.encoding);
                 ^

Error: EPERM: operation not permitted, mkdtemp 'C:\Users\teasp\AppData\Local\Temp\data-real-guard-XXXXXX'
    at Object.mkdtempSync (node:fs:3600:18)
    at Object.<anonymous> (C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard\fit-finder\tools\data-real-guard-selftest.js:5:16)
    at Module._compile (node:internal/modules/cjs/loader:1934:14)
    at Object..js (node:internal/modules/cjs/loader:2074:10)
    at Module.load (node:internal/modules/cjs/loader:1656:32)
    at Module._load (node:internal/modules/cjs/loader:1448:12)
    at wrapModuleLoad (node:internal/modules/cjs/loader:261:19)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47 {
  errno: -4048,
  code: 'EPERM',
  syscall: 'mkdtemp',
  path: 'C:\\Users\\teasp\\AppData\\Local\\Temp\\data-real-guard-XXXXXX'
}

Node.js v26.5.0

hook: PostToolUse
 succeeded in 793ms:
## Subagent dispatch requires multi-agent support

Add to your Codex config (`~/.codex/config.toml`):

```toml
[features]
multi_agent = true
```

This enables the multi-agent tools that skills like
`dispatching-parallel-agents` and `subagent-driven-development` use.
Which tools you get depends on the multi-agent version your model
preset selects (current presets run V2; older ones run V1). Trust your
actual tool list over any table ���?" including this one ���?" when they
disagree.

- **Spawning:** give children a clean context with
  `spawn_agent {fork_turns: "none"}`; the default `"all"` copies your
  entire transcript into the child. On Codex 0.145+, role files under
  `~/.codex/agents/` attach to isolated forks via `agent_type`.
  Full-history forks accept `model` and `reasoning_effort` overrides
  (only `agent_type` is refused there) ���?" isolated forks are the SDD
  default for context hygiene, not because overrides require them.
- **Fix rounds:** resume the implementer with `followup_task` ���?" it
  delivers your message, triggers a turn, and transparently reloads a
  child the harness evicted. Never dispatch a fresh implementer on the
  theory that a spawned agent cannot be messaged again; on V2 it
  always can.
- **Lifecycle:** V2 has no `close_agent`. Finished children are
  evicted automatically when slots are needed; leaving them unclosed
  costs nothing. Only V1 sessions have `close_agent` ���?" there, close
  reviewers when their review returns, and close each implementer
  after its task's review passes.
- **Model names:** never copy a model name from a skill, table, or old
  session into `spawn_agent` without checking it against your current
  spawn allowlist ���?" V2 accepts only V2-capable presets and hard-errors
  on the rest.

## Waiting on children

`wait_agent` is an event subscription, not a poll: a long wait wakes
the moment a child produces mailbox activity, with the same latency as
a short one. Short-timeout polling buys nothing and costs a tool call ���?"
and a context rebill ���?" per poll. In measured sessions, roughly
two-thirds of all wait calls were short polls that timed out.

- While you still have local work, do not wait at all. A completed
  child's final answer is pushed into your mailbox and arrives with
  your next turn.
- When you are genuinely idle with children outstanding, wait in
  bounded stretches: `wait_agent` with `timeout_ms` 300000-600000
  (5-10 minutes). After each stretch ���?" wake or timeout ���?" post one
  status line, run `list_agents`, and chase any child that finished
  without reporting. Never stack polls shorter than five minutes; the
  event subscription wakes a bounded stretch just as fast as a short
  one.
- Completion mail cannot wake an idle controller (it is delivered
  without triggering a turn); covering that idle window is
  `wait_agent`'s only job. A stretch that times out with no activity
  is your cue to reconcile, not to shorten the next stretch.

## Model routing on spawns

Every `spawn_agent` you issue ���?" including when you are yourself a
spawned child running a fan-out ���?" sets `model` AND `reasoning_effort`
explicitly, per the Model Selection rules of the skill you are
executing. Setting `model` alone is a trap: the child's effort
silently resets to that model's default, not to yours.

Ask your human partner to add a machine-level backstop to
`~/.codex/config.toml` so any spawn that slips through still routes to
a deliberate tier instead of silently inheriting the session's most
expensive model:

```toml
[agents]
default_subagent_model = "<a mid-tier model from your spawn allowlist>"
default_subagent_reasoning_effort = "medium"
```

## Environment Detection

Skills that create worktrees or finish branches should detect their
environment with read-only git commands before proceeding:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` ���+' already in a linked worktree (skip creation)
- `BRANCH` empty ���+' detached HEAD (cannot branch/push/PR from sandbox)

See `using-git-worktrees` Step 0 and `finishing-a-development-branch`
Step 1 for how each skill uses these signals.

## Codex App Finishing

When the sandbox blocks branch/push operations (detached HEAD in an
externally managed worktree), the agent commits all work and informs
the user to use the App's native controls:

- **"Create branch"** ���?" names the branch, then commit/push/PR via App UI
- **"Hand off to local"** ���?" transfers work to the user's local checkout

The agent can still run tests, stage files, and output suggested branch
names, commit messages, and PR descriptions for the user to copy.

hook: PostToolUse
 succeeded in 844ms:
commit d007e0b3dd547084be13d9330b60176632432eac
Author:     Ian <iansomintac.contact@gmail.com>
AuthorDate: Sun Oct 25 18:07:43 2026 -0700
Commit:     Ian <iansomintac.contact@gmail.com>
CommitDate: Sun Oct 25 18:07:43 2026 -0700

    fit-finder: gate-check fails when data/real is tracked by git (studio-harness F3)
    
    New tools/data-real-guard.js (git ls-files -- data/real; fails closed),
    called by gate-check.js on every run. Test first:
    tools/data-real-guard-selftest.js in a throwaway repo with a fake file
    (7 checks). Evidence: docs/evidence/2026-10-26-f3-data-real-guard.md.
    
    Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_01FxbuZBzRD5fEEEsCr7ohwC

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
About 8 minutes left. The selftest was blocked at `mkdtemp` with EPERM, before it created a fixture. I�?Tll distinguish fresh in-memory checks from code inspection and the recorded red/green output. I also won�?Tt run `gate-selftest.js`: it reads files outside your allowlist.
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const fs = require('fs'), vm = require('vm'), path = require('path');
const gateSource = fs.readFileSync('fit-finder/tools/gate-check.js', 'utf8');
const guardSource = fs.readFileSync('fit-finder/tools/data-real-guard.js', 'utf8');
const line = n => "'`first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits ${n} (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)`;
function doc(stage, outcome) {
  const n = outcome === '"'inconclusive' ? 5 : 8;
  let s = "'`BASE-SHA: ae60341'"\\nBEFORE-LINE: "'${line(n)}'"\\nBEFORE: feature 17 of 29, wrong 2, no card "'${n}, not-a-fit 0'"\\nPREDICTION-PM: x\\nPREDICTION-LEAD: y\\n"'`;
  if (outcome === '"'inconclusive') s += 'OUTCOME: inconclusive\\nREASON: before no-card < 6 (5)\\n';
  else if (stage === 'final') {
    const after = outcome === 'kept' ? 6 : 7;
    s += "'`AFTER-LINE: ${line(after)}'"\\nAFTER: feature 17 of 29, wrong 2, no card "'${after}, not-a-fit 0'"\\nOUTCOME: "'${outcome}'"\\nREASON: "'${outcome === '"'kept' ? 'none' : 'no-card fall < 2 (8 to 7)'}\\nPREDICTION: "'${outcome === '"'kept' ? 'held' : 'did not hold'}\\n"'`;
  }
  return s;
}
function run(stage, outcome, noGit, result, cwdLabel) {
  const calls = [], output = [], exit = {};
  const spawnSync = (cmd, args, options) => { calls.push({cmd,args,cwd:options.cwd}); return result; };
  const helper = {exports:{}};
  vm.runInNewContext(guardSource,{require:n=>{if(n==='"'child_process')return {spawnSync};throw Error(n)},module:helper,console});
  const root = path.resolve('fit-finder/tools');
  let code=0;
  try {vm.runInNewContext(gateSource, {
    __dirname:root, console:{log:s=>output.push(s)},
    process:{argv:['node','gate-check.js','memory-evidence','--stage',stage,...(noGit?['--no-git']:[])],cwd:()=>cwdLabel,exit:n=>{code=n;throw exit}},
    require:n=>{if(n==='fs')return {readFileSync:()=>doc(stage,outcome)};if(n==='path')return path;if(n==='child_process')return {spawnSync};if(n==='./data-real-guard.js')return helper.exports;throw Error(n)}
  });} catch(e) {if(e"'!==exit)throw e;}
  return {code,output:output.join('"'\\n'),calls};
}
let count=0;
for(const [stage,outcome] of [['before','pending'],['before','inconclusive'],['final','inconclusive'],['final','kept'],['final','reverted']]) {
  for(const noGit of [true,false]) {
    for(const cwd of ['C:/elsewhere','C:/space and [odd]/subfolder']) {
      const r=run(stage,outcome,noGit,{status:0,stdout:'data/real/sub/odd name.jsonl\\n',stderr:''},cwd);
      if(r.code"'!==1 || !r.output.includes('"'data/real is tracked by git:') || r.calls.length"'!==1 || r.calls[0].cwd!==path.resolve('"'fit-finder'))throw Error(JSON.stringify(r));
      count++;
    }
  }
}
console.log("'`IN-MEMORY: ${count} tracked gate cases exit 1 across stage/outcome/no-git/caller-cwd; only guard called`);
for(const [name,result] of [['"'not-repo',{status:128,stdout:'',stderr:'fatal: not a git repository'}],['missing-git',{status:null,stdout:null,stderr:null,error:{message:'spawnSync git ENOENT'}}],['other-failure',{status:1,stdout:'',stderr:'bad index'}],['signal',{status:null,stdout:'',stderr:''}],['buffer-overflow',{status:null,stdout:'x',error:{message:'ENOBUFS'}}]]) {
  const r=run('before','pending',true,result,'C:/elsewhere');
  if(r.code"'!==1 || !r.output.includes('"'git ls-files failed'))throw Error(JSON.stringify(r));
  console.log("'`IN-MEMORY: ${name} -> gate exit ${r.code}`);
}
const control=run('"'before','pending',true,{status:0,stdout:'',stderr:''},'C:/elsewhere');
if(control.code"'!==0)throw Error(JSON.stringify(control));
console.log('"'IN-MEMORY: clean-index control -> gate exit 0');
'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 636ms:
IN-MEMORY: 20 tracked gate cases exit 1 across stage/outcome/no-git/caller-cwd; only guard called
IN-MEMORY: not-repo -> gate exit 1
IN-MEMORY: missing-git -> gate exit 1
IN-MEMORY: other-failure -> gate exit 1
IN-MEMORY: signal -> gate exit 1
IN-MEMORY: buffer-overflow -> gate exit 1
IN-MEMORY: clean-index control -> gate exit 0

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only prompt-coach...HEAD -- fit-finder/tools/data-real-guard.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const {spawnSync}=require('child_process'), path=require('path'),os=require('os');
const cwd=path.resolve('fit-finder');
const allowed=['ls-files','--','tools/data-real-guard.js'];
for(const [name,extra] of [['normal',{}],['alternate missing index',{GIT_INDEX_FILE:path.join(os.tmpdir(),"'`f3-judge-absent-index-${process.pid}-${Date.now()}`)}],['"'redirected worktree',{GIT_WORK_TREE:os.tmpdir()}]]){
 const r=spawnSync('git',allowed,{cwd,encoding:'utf8',env:{...process.env,...extra}});
 console.log(JSON.stringify({name,status:r.status,allowedToolPaths:r.stdout.trim(),error:r.stderr.trim()}));
}
'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only prompt-coach...HEAD -- Fit-Finder/tools/data-real-guard.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only prompt-coach...HEAD -- fit-finder/TOOLS/data-real-guard.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 319ms:
fit-finder/tools/data-real-guard.js

hook: PostToolUse
 succeeded in 338ms:
hook: PostToolUse
 succeeded in 344ms:
hook: PostToolUse
 succeeded in 872ms:
{"name":"normal","status":0,"allowedToolPaths":"tools/data-real-guard.js","error":""}
{"name":"alternate missing index","status":0,"allowedToolPaths":"","error":""}
{"name":"redirected worktree","status":0,"allowedToolPaths":"","error":""}

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
About 5 minutes left. I found a potential bypass through inherited Git environment variables: using an allowed tracked tool file as a safe proxy, both an alternate missing `GIT_INDEX_FILE` and a redirected `GIT_WORK_TREE` made Git return success with no paths. The guard inherits those variables. I�?Tm checking Windows path matching before assigning severity.
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const {spawnSync}=require('child_process'), path=require('path');
const root=process.cwd();
const tests=[
 ['exact',path.join(root,'fit-finder'),['ls-files','--','tools/data-real-guard.js']],
 ['uppercase file pathspec',path.join(root,'fit-finder'),['ls-files','--','tools/DATA-REAL-GUARD.js']],
 ['uppercase pathspec ignorecase true',path.join(root,'fit-finder'),['-c','core.ignorecase=true','ls-files','--','tools/DATA-REAL-GUARD.js']],
 ['uppercase cwd',path.join(root,'FIT-FINDER'),['ls-files','--','tools/data-real-guard.js']],
 ['uppercase tools cwd',path.join(root,'fit-finder','TOOLS'),['ls-files','--','data-real-guard.js']],
 ['icase pathspec',path.join(root,'fit-finder'),['ls-files','--',':(icase)tools/DATA-REAL-GUARD.js']]
];
for(const [name,cwd,args] of tests){const r=spawnSync('git',args,{cwd,encoding:'utf8'});console.log(JSON.stringify({name,status:r.status,allowedToolPaths:r.stdout,error:r.stderr}));}
'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 782ms:
{"name":"exact","status":0,"allowedToolPaths":"tools/data-real-guard.js\n","error":""}
{"name":"uppercase file pathspec","status":0,"allowedToolPaths":"","error":""}
{"name":"uppercase pathspec ignorecase true","status":0,"allowedToolPaths":"","error":""}
{"name":"uppercase cwd","status":0,"allowedToolPaths":"tools/data-real-guard.js\n","error":""}
{"name":"uppercase tools cwd","status":0,"allowedToolPaths":"data-real-guard.js\n","error":""}
{"name":"icase pathspec","status":0,"allowedToolPaths":"tools/data-real-guard.js\n","error":""}

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync('fit-finder/tools/data-real-guard.js','utf8');
let output='';const calls=[];const m={exports:{}};
vm.runInNewContext(source,{module:m,require:n=>({spawnSync:(cmd,args,opts)=>{calls.push({cmd,args,opts});return {status:0,stdout:output,stderr:''};}})});
for(const [name,text] of [
 ['spaces','data/real/fake file.jsonl\\n'],
 ['subfolder','data/real/sub/deep/fake.jsonl\\n'],
 ['quoted unusual name','\"data/real/a\\\\nb.jsonl\"\\n'],
 ['tracked symlink path itself','data/real\\n'],
 ['tracked gitlink at data/real','data/real\\n'],
 ['tracked gitlink under data/real','data/real/submodule\\n'],
 ['empty index','']
]){output=text;const r=m.exports.trackedReal('C:/fixture with spaces/fit-finder');console.log(JSON.stringify({injectedGitResult:name,ok:r.ok,count:r.files.length,wouldReject:r.files.length>0}));}
console.log('Exact spawn contract: '+JSON.stringify(calls[0]));
'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 578ms:
{"injectedGitResult":"spaces","ok":true,"count":1,"wouldReject":true}
{"injectedGitResult":"subfolder","ok":true,"count":1,"wouldReject":true}
{"injectedGitResult":"quoted unusual name","ok":true,"count":1,"wouldReject":true}
{"injectedGitResult":"tracked symlink path itself","ok":true,"count":1,"wouldReject":true}
{"injectedGitResult":"tracked gitlink at data/real","ok":true,"count":1,"wouldReject":true}
{"injectedGitResult":"tracked gitlink under data/real","ok":true,"count":1,"wouldReject":true}
{"injectedGitResult":"empty index","ok":true,"count":0,"wouldReject":false}
Exact spawn contract: {"cmd":"git","args":["ls-files","--","data/real"],"opts":{"cwd":"C:/fixture with spaces/fit-finder","encoding":"utf8"}}

hook: PostToolUse
hook: PostToolUse Completed
codex
Two must-fixes prevent an unconditional pass.

1. **Bind the check to the intended repository and index.** [data-real-guard.js:5](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/data-real-guard.js:5) inherits Git�?Ts environment. Using only an allowed tracked tool file as a safe proxy, I measured:
   - Normal environment: Git listed the tracked file.
   - `GIT_INDEX_FILE` pointing to a nonexistent index: exit **0**, empty output.
   - `GIT_WORK_TREE` redirected elsewhere: exit **0**, empty output.

   The guard accepts both empty results. With `--no-git`, that permits otherwise-valid evidence to pass. Inherited Git variables can be an honest mistake; deliberately exploiting them also has a small fix. Clear repository/index overrides and anchor the intended repository. Apply the same isolation to the selftest�?Ts Git commands, which currently inherit these variables too.

2. **Handle Windows case variants.** The literal `data/real` pathspec is case-sensitive, even with `core.ignorecase=true`. I verified that behavior against allowed tool paths: exact spelling listed the tracked file; changed case returned exit **0** with nothing. An index entry under `data/REAL/...` can therefore escape this check while referring to the same Windows directory. Use case-insensitive matching on Windows and add a fixture case.

The join itself is sound. At [gate-check.js:17](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/gate-check.js:17), guard failures enter `bad` before stage/outcome checks and before the `--no-git` condition. Nothing subsequently clears them. **Whenever the selected Git command returns paths or errors, the gate fails in every valid mode.**

Fresh in-memory execution of the actual allowed source confirmed:

- **20 tracked-output cases** exited 1 across before/final, pending/inconclusive/kept/reverted, both Git modes, and different caller directories.
- Injected not-a-repository, missing-Git, other failure, signal, and buffer-overflow results each made the gate exit 1.
- An empty successful result allowed the valid control to exit 0.

The new selftest is **not vacuous under a normal environment**. It copies the actual gate and helper into a throwaway repo, establishes a passing control, stages a fake file, requires the gate to fail with that filename, then unstages it and requires another pass. Removing the join would fail its tracked-gate assertion. The outside-repository case tests only the helper.

Test-first chronology is supported by the [recorded red/green output](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/docs/evidence/2026-10-26-f3-data-real-guard.md:16), especially the recorded failure with the join absent. One final commit cannot independently establish that chronology.

Other bypass results and limits:

| Attempt | Result |
|---|---|
| Caller cwd; paths containing spaces | In-memory checks rejected tracked output; gate anchors cwd to its script location. |
| Staged but uncommitted file | Covered by the fixture�?Ts code and recorded run; no commit is made. |
| Subfolders; spaces or unusual filenames | Injected outputs were rejected; parsing needs only one nonempty line. |
| Uppercase caller cwd | Actual safe Git probe still found the tracked tool file. |
| Tracked `data/real` symlink or submodule | Inspection indicates detection: the symlink/gitlink path itself is listed. Injected outputs were rejected. |
| Unregistered nested repo | Its independently tracked contents are outside the outer index. A nested repo at `fit-finder/` can also shadow the intended outer index; repository anchoring should address that. Not dynamically tested. |
| Sparse checkout / skip-worktree | No filesystem-existence filter is present; these should remain visible through the index. Not dynamically tested. |
| Another `data/real` elsewhere in the repo | Outside this check�?Ts specified Fit Finder scope. |
| Early exits and check order | Invalid arguments exit 2; unreadable evidence exits nonzero. Neither creates a successful bypass. Guard failures skip the later Git checks and reach exit 1. |

The selftest run was blocked at `mkdtemp` with **EPERM**, before creating its fixture. I relied on code inspection and the recorded output for its filesystem behavior. I did not run `gate-selftest.js`, because it reads files outside your allowlist. No customer-data paths were opened or listed, and no files were edited.

Verdict: FAIL
hook: Stop
hook: Stop Completed
tokens used
74,030
Two must-fixes prevent an unconditional pass.

1. **Bind the check to the intended repository and index.** [data-real-guard.js:5](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/data-real-guard.js:5) inherits Git�?Ts environment. Using only an allowed tracked tool file as a safe proxy, I measured:
   - Normal environment: Git listed the tracked file.
   - `GIT_INDEX_FILE` pointing to a nonexistent index: exit **0**, empty output.
   - `GIT_WORK_TREE` redirected elsewhere: exit **0**, empty output.

   The guard accepts both empty results. With `--no-git`, that permits otherwise-valid evidence to pass. Inherited Git variables can be an honest mistake; deliberately exploiting them also has a small fix. Clear repository/index overrides and anchor the intended repository. Apply the same isolation to the selftest�?Ts Git commands, which currently inherit these variables too.

2. **Handle Windows case variants.** The literal `data/real` pathspec is case-sensitive, even with `core.ignorecase=true`. I verified that behavior against allowed tool paths: exact spelling listed the tracked file; changed case returned exit **0** with nothing. An index entry under `data/REAL/...` can therefore escape this check while referring to the same Windows directory. Use case-insensitive matching on Windows and add a fixture case.

The join itself is sound. At [gate-check.js:17](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/gate-check.js:17), guard failures enter `bad` before stage/outcome checks and before the `--no-git` condition. Nothing subsequently clears them. **Whenever the selected Git command returns paths or errors, the gate fails in every valid mode.**

Fresh in-memory execution of the actual allowed source confirmed:

- **20 tracked-output cases** exited 1 across before/final, pending/inconclusive/kept/reverted, both Git modes, and different caller directories.
- Injected not-a-repository, missing-Git, other failure, signal, and buffer-overflow results each made the gate exit 1.
- An empty successful result allowed the valid control to exit 0.

The new selftest is **not vacuous under a normal environment**. It copies the actual gate and helper into a throwaway repo, establishes a passing control, stages a fake file, requires the gate to fail with that filename, then unstages it and requires another pass. Removing the join would fail its tracked-gate assertion. The outside-repository case tests only the helper.

Test-first chronology is supported by the [recorded red/green output](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/docs/evidence/2026-10-26-f3-data-real-guard.md:16), especially the recorded failure with the join absent. One final commit cannot independently establish that chronology.

Other bypass results and limits:

| Attempt | Result |
|---|---|
| Caller cwd; paths containing spaces | In-memory checks rejected tracked output; gate anchors cwd to its script location. |
| Staged but uncommitted file | Covered by the fixture�?Ts code and recorded run; no commit is made. |
| Subfolders; spaces or unusual filenames | Injected outputs were rejected; parsing needs only one nonempty line. |
| Uppercase caller cwd | Actual safe Git probe still found the tracked tool file. |
| Tracked `data/real` symlink or submodule | Inspection indicates detection: the symlink/gitlink path itself is listed. Injected outputs were rejected. |
| Unregistered nested repo | Its independently tracked contents are outside the outer index. A nested repo at `fit-finder/` can also shadow the intended outer index; repository anchoring should address that. Not dynamically tested. |
| Sparse checkout / skip-worktree | No filesystem-existence filter is present; these should remain visible through the index. Not dynamically tested. |
| Another `data/real` elsewhere in the repo | Outside this check�?Ts specified Fit Finder scope. |
| Early exits and check order | Invalid arguments exit 2; unreadable evidence exits nonzero. Neither creates a successful bypass. Guard failures skip the later Git checks and reach exit 1. |

The selftest run was blocked at `mkdtemp` with **EPERM**, before creating its fixture. I relied on code inspection and the recorded output for its filesystem behavior. I did not run `gate-selftest.js`, because it reads files outside your allowlist. No customer-data paths were opened or listed, and no files were edited.

Verdict: FAIL
exit 0
````

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
I’m using `$superpowers:verification-before-completion` to separate fresh measurements from recorded evidence, and `$task-observer` in read-only mode. The startup check reported that the harness fetch failed and found no GOAL.md; neither prevents this scoped review.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git log -6 --oneline; git show --format=fuller --no-patch 3c059b4; git diff d007e0b 3c059b4 -- fit-finder/tools; Get-Content -LiteralPath 'docs/evidence/2026-10-26-f3-data-real-guard.md' -TotalCount 210" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content -LiteralPath '"'fit-finder/tools/data-real-guard.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i,$_ }; $i=0; Get-Content -LiteralPath '"'fit-finder/tools/data-real-guard-selftest.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i,$_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content -LiteralPath '"'fit-finder/tools/gate-check.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i,$_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
hook: PostToolUse
 succeeded in 1112ms:
   1: /* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
   2:    Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed).
   3:    Inherited GIT_DIR-style env vars are dropped so they cannot point git at another repo or index, and the data/real
   4:    segment is matched in any case (data/REAL on Windows is the same folder). */
   5: const { spawnSync } = require('child_process');
   6: const DROP = ['GIT_DIR', 'GIT_INDEX_FILE', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY'];
   7: const REAL = /(^|\/)data\/real(\/|$)/i;
   8: function trackedReal(dir) {
   9:   const env = { ...process.env };
  10:   for (const k of Object.keys(env)) if (DROP.includes(k.toUpperCase())) delete env[k];
  11:   const r = spawnSync('git', ['-C', dir, 'ls-files', '-z'], { cwd: dir, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
  12:   if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
  13:   return { ok: true, files: r.stdout.split('\0').filter((f) => f && REAL.test(f)) };
  14: }
  15: module.exports = { trackedReal };
  16: if (require.main === module) {
  17:   const t = trackedReal(process.cwd());
  18:   if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
  19:   if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
  20:   console.log('data-real-guard ok');
  21: }
   1: /* node tools/data-real-guard-selftest.js : exercises data-real-guard.js and its call from gate-check.js in a throwaway git repo
   2:    (fake files only; the real data/real is never read). Prints data-real-guard-selftest ok or the first failure. */
   3: const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
   4: const fail = (m) => { console.log('data-real-guard-selftest FAIL: ' + m); process.exit(1); };
   5: const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-real-guard-'));
   6: const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
   7: 
   8: // throwaway repo shaped like workiva: <repo>/fit-finder/tools/{gate-check,data-real-guard}.js copied from this checkout
   9: const repo = path.join(tmp, 'repo'), ff = path.join(repo, 'fit-finder');
  10: fs.mkdirSync(path.join(ff, 'tools'), { recursive: true });
  11: fs.mkdirSync(path.join(ff, 'data', 'real'), { recursive: true });
  12: for (const f of ['gate-check.js', 'data-real-guard.js']) fs.copyFileSync(path.join(__dirname, f), path.join(ff, 'tools', f));
  13: if (git(repo, 'init', '-q').status !== 0) fail('git init');
  14: fs.writeFileSync(path.join(ff, 'data', 'real', 'fake.jsonl'), '{"fake":"not real data"}\n');
  15: fs.writeFileSync(path.join(ff, 'README.md'), 'x\n');
  16: git(repo, 'add', 'fit-finder/README.md');
  17: 
  18: // a valid before-stage evidence doc (no-card 8, so no OUTCOME needed)
  19: const line = 'first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits 8 (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)';
  20: const ev = path.join(tmp, 'ev.md');
  21: fs.writeFileSync(ev, ['BASE-SHA: ae60341', 'BEFORE-LINE: ' + line, 'BEFORE: feature 17 of 29, wrong 2, no card 8, not-a-fit 0', 'PREDICTION-PM: x', 'PREDICTION-LEAD: y'].join('\n') + '\n');
  22: const gate = (env = {}) => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8', env: { ...process.env, ...env } });
  23: const guard = (cwd, env = {}) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp, ...env } });
  24: let n = 0;
  25: const expect = (name, r, code, re) => {
  26:   n++;
  27:   if (r.status !== code || !re.test(r.stdout)) fail(`${name}: want exit ${code} matching ${re}, got ${r.status}: ${(r.stdout + r.stderr).trim()}`);
  28: };
  29: 
  30: // 1-2. control: data/real exists on disk but is untracked, so guard and done check pass
  31: expect('untracked guard', guard(ff), 0, /^data-real-guard ok/);
  32: expect('untracked gate', gate(), 0, /^gate-check ok before/);
  33: 
  34: // 3-5. tracked: git add a file under data/real, and both fail naming it
  35: git(repo, 'add', '-f', 'fit-finder/data/real/fake.jsonl');
  36: expect('tracked guard', guard(ff), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
  37: expect('tracked gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
  38: const { trackedReal } = require(path.join(ff, 'tools', 'data-real-guard.js'));
  39: const t = trackedReal(ff);
  40: if (!t.ok || t.files.join() !== 'data/real/fake.jsonl') fail('trackedReal lists ' + JSON.stringify(t));
  41: n++;
  42: 
  43: // 6-15. inherited git env vars that point git at another repo, index or tree must not hide the tracked file
  44: const other = path.join(tmp, 'other');
  45: fs.mkdirSync(other);
  46: git(other, 'init', '-q');
  47: const misleading = {
  48:   GIT_DIR: path.join(other, '.git'),
  49:   GIT_INDEX_FILE: path.join(tmp, 'empty-index'),
  50:   GIT_WORK_TREE: other,
  51:   GIT_COMMON_DIR: path.join(other, '.git'),
  52:   GIT_OBJECT_DIRECTORY: path.join(other, '.git', 'objects'),
  53: };
  54: for (const [k, v] of Object.entries(misleading)) {
  55:   expect(`${k} guard`, guard(ff, { [k]: v }), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
  56:   expect(`${k} gate`, gate({ [k]: v }), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
  57: }
  58: 
  59: // 16. untrack again: passes again
  60: git(repo, 'rm', '-q', '--cached', 'fit-finder/data/real/fake.jsonl');
  61: expect('untracked again gate', gate(), 0, /^gate-check ok before/);
  62: 
  63: // 17-19. a case variant (data/REAL) is caught too; put straight in the index so the test does not depend on the disk's case rules
  64: const blob = git(repo, 'hash-object', '-w', 'fit-finder/data/real/fake.jsonl').stdout.trim();
  65: git(repo, 'update-index', '--add', '--cacheinfo', `100644,${blob},fit-finder/data/REAL/x.jsonl`);
  66: expect('case variant guard', guard(ff), 1, /data-real-guard FAIL: .*data\/REAL\/x\.jsonl/);
  67: expect('case variant gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/REAL\/x\.jsonl/);
  68: git(repo, 'update-index', '--force-remove', 'fit-finder/data/REAL/x.jsonl');
  69: expect('case variant removed gate', gate(), 0, /^gate-check ok before/);
  70: 
  71: // 20. fails closed outside a git repo (git ls-files errors)
  72: const bare = path.join(tmp, 'not-a-repo');
  73: fs.mkdirSync(bare);
  74: expect('no repo guard', guard(bare), 1, /data-real-guard FAIL: git ls-files failed/);
  75: 
  76: fs.rmSync(tmp, { recursive: true, force: true });
  77: console.log(`data-real-guard-selftest ok (${n} checks)`);

 succeeded in 1053ms:
   1: /* node tools/gate-check.js <EV> --stage before|final [--no-git]
   2:    Checks the gate evidence doc: summaries derived from the score lines, the keep rule, the REASON text, prediction order, git state. */
   3: const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
   4: const a = process.argv.slice(2);
   5: const stage = a.indexOf('--stage') >= 0 ? a[a.indexOf('--stage') + 1] : '';
   6: const noGit = a.includes('--no-git');
   7: const file = a.find((x, i) => !x.startsWith('--') && a[i - 1] !== '--stage');
   8: if (!file || !['before', 'final'].includes(stage)) { console.log('usage: gate-check.js <EV> --stage before|final [--no-git]'); process.exit(2); }
   9: const root = path.join(__dirname, '..');
  10: const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  11: const get = (tag) => {
  12:   const i = lines.findIndex((l) => l.startsWith(tag));
  13:   return i < 0 ? null : { i, v: lines[i].slice(tag.length).trim() };
  14: };
  15: const bad = [];
  16: // always, even with --no-git: real data must never be tracked (studio-harness F3)
  17: const real = require('./data-real-guard.js').trackedReal(root);
  18: if (!real.ok) bad.push(real.error);
  19: else if (real.files.length) bad.push('data/real is tracked by git: ' + real.files.join(', '));
  20: function parse(text) {
  21:   const m = (re) => { const x = re.exec(text); return x ? +x[1] : NaN; };
  22:   const s = /split: right feature first (\d+) of (\d+)/.exec(text);
  23:   const r = { R: s ? +s[1] : NaN, F: s ? +s[2] : NaN, W: m(/wrong card (\d+)/), N: m(/no card where one fits (\d+)/), K: m(/card on a not-a-fit prompt (\d+)/) };
  24:   return Object.values(r).some(Number.isNaN) ? null : r;
  25: }
  26: const derived = (x) => `feature ${x.R} of ${x.F}, wrong ${x.W}, no card ${x.N}, not-a-fit ${x.K}`;
  27: function side(lineTag, sumTag) {
  28:   const L = get(lineTag), S = get(sumTag);
  29:   if (!L) { bad.push('missing ' + lineTag); return null; }
  30:   const p = parse(L.v);
  31:   if (!p) { bad.push(lineTag + ' lacks the score numbers'); return null; }
  32:   if (!S) bad.push('missing ' + sumTag);
  33:   else if (S.v !== derived(p)) bad.push(`${sumTag} should be "${derived(p)}"`);
  34:   return { p, L };
  35: }
  36: const base = get('BASE-SHA:');
  37: if (!base || !base.v) bad.push('missing BASE-SHA:');
  38: const b = side('BEFORE-LINE:', 'BEFORE:');
  39: const pm = get('PREDICTION-PM:'), lead = get('PREDICTION-LEAD:');
  40: if (!pm) bad.push('missing PREDICTION-PM:');
  41: if (!lead) bad.push('missing PREDICTION-LEAD:');
  42: const outcome = get('OUTCOME:'), reason = get('REASON:');
  43: let a1 = null;
  44: const finalOutcome = outcome ? outcome.v : 'pending';
  45: if (b) {
  46:   const N0 = b.p.N, inconclusive = N0 < 6;
  47:   if (inconclusive) {
  48:     if (!outcome || outcome.v !== 'inconclusive') bad.push('before no-card < 6: OUTCOME must be inconclusive');
  49:     if (!reason || reason.v !== `before no-card < 6 (${N0})`) bad.push(`REASON must be "before no-card < 6 (${N0})"`);
  50:   }
  51:   if (stage === 'final') {
  52:     if (inconclusive) {
  53:       if (get('AFTER-LINE:') || get('AFTER:')) bad.push('inconclusive run must have no AFTER-LINE or AFTER:');
  54:     } else {
  55:       a1 = side('AFTER-LINE:', 'AFTER:');
  56:       if (!outcome || !['kept', 'reverted'].includes(outcome.v)) bad.push('OUTCOME must be kept or reverted');
  57:       const al = get('AFTER-LINE:');
  58:       if (al && pm && lead && (pm.i > al.i || lead.i > al.i)) bad.push('PREDICTION lines must come before AFTER-LINE');
  59:       if (a1) {
  60:         const x = b.p, y = a1.p, why = [];
  61:         if (!(x.N - y.N >= 2)) why.push(`no-card fall < 2 (${x.N} to ${y.N})`);
  62:         if (!(y.W <= x.W)) why.push(`wrong card rose (${x.W} to ${y.W})`);
  63:         if (!(y.K <= x.K)) why.push(`not-a-fit card rose (${x.K} to ${y.K})`);
  64:         const kept = why.length === 0, want = kept ? 'none' : why.join(' and ');
  65:         if (outcome && outcome.v !== (kept ? 'kept' : 'reverted')) bad.push(`OUTCOME should be ${kept ? 'kept' : 'reverted'}`);
  66:         if (!reason || reason.v !== want) bad.push(`REASON should be "${want}"`);
  67:         const pr = get('PREDICTION:');
  68:         if (!pr || pr.v !== (kept ? 'held' : 'did not hold')) bad.push(`PREDICTION: should be "${kept ? 'held' : 'did not hold'}"`);
  69:       }
  70:     }
  71:   }
  72: }
  73: if (!noGit && base && base.v && !bad.length) {
  74:   const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8' }).status;
  75:   const sha = base.v, mf = path.join(root, 'tests/match-frozen.js');
  76:   const same = run('git', ['diff', '--quiet', sha, 'HEAD', '--', ':(top)fit-finder/engine/fit.js']) === 0;
  77:   if (finalOutcome === 'kept') {
  78:     if (same) bad.push('kept but engine/fit.js equals BASE');
  79:     if (run('node', [mf, '--base', sha, '--allow', 'engine']) !== 0) bad.push('match-frozen --allow engine fails');
  80:     if (run('node', [mf, '--base', sha]) === 0) bad.push('match-frozen passes without --allow engine');
  81:   } else {
  82:     if (!same) bad.push('engine/fit.js differs from BASE but outcome is ' + finalOutcome);
  83:     if (run('node', [mf, '--base', sha]) !== 0) bad.push('match-frozen --base fails');
  84:   }
  85: }
  86: if (bad.length) { console.log('gate-check FAIL: ' + bad.join('; ')); process.exit(1); }
  87: const f = (t, x) => `${t} feature ${x.R} of ${x.F} wrong ${x.W} no-card ${x.N} not-a-fit ${x.K}`;
  88: console.log(`gate-check ok ${stage} ${finalOutcome}; ${f('before', b.p)}` + (a1 ? `; ${f('after', a1.p)}` : ''));

hook: PostToolUse
 succeeded in 1503ms:
3c059b4 fit-finder: data-real guard drops inherited GIT_DIR-style env vars and matches data/real in any case (Codex must-fixes)
cb3924d evidence: F3 Fit Finder Codex judge (Verdict: FAIL, 2 must-fixes)
d007e0b fit-finder: gate-check fails when data/real is tracked by git (studio-harness F3)
fb26061 Merge prompt-coach-c3-sandbox: C3 sandbox test (C3a 13/24 MISS, C3b 0/24 PASS, C3c 58 vs 63 MISS), evidence, next talk prompt
156034f Prompt coach C3: next talk prompt (after C3 miss)
2aec56c Prompt coach C3: README wording (final review note: "never run" read as current)
commit 3c059b4d53334a401cd5bad419cf2696f1ef8149
Author:     Ian <iansomintac.contact@gmail.com>
AuthorDate: Sun Oct 25 22:35:20 2026 -0700
Commit:     Ian <iansomintac.contact@gmail.com>
CommitDate: Sun Oct 25 22:35:20 2026 -0700

    fit-finder: data-real guard drops inherited GIT_DIR-style env vars and matches data/real in any case (Codex must-fixes)
    
    trackedReal now runs git -C <fit-finder> ls-files -z with GIT_DIR,
    GIT_INDEX_FILE, GIT_WORK_TREE, GIT_COMMON_DIR and GIT_OBJECT_DIRECTORY
    removed, and keeps paths matching /(^|\/)data\/real(\/|$)/i. Tests first:
    13 new selftest checks (20 in all); red on the old guard for GIT_DIR,
    GIT_INDEX_FILE, GIT_WORK_TREE and data/REAL. Evidence and tools README
    updated.
    
    Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
diff --git a/fit-finder/tools/README.md b/fit-finder/tools/README.md
index 9e07528..53a02df 100644
--- a/fit-finder/tools/README.md
+++ b/fit-finder/tools/README.md
@@ -17,7 +17,7 @@ Small scripts for the BCA run. Run them from `fit-finder/` (paths are relative t
 | `ops-check.js` | `<base sha>` | `ops-check ok <n> cards changed` | 1 on any violation |
 | `diag-nocard.js`, `diag-selftest.js` | `[--engine <path>]` (self-test only); selftest: none (needs `FF_LEDGER`) | `diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K`; selftest `diag-selftest ok` | 1 with `INVALID: ...` if tune wrong > 4, tune not-a-fit > BASE_K or half A wrong > 0; 2 on bad input. Reads only the tune set and half A |
 | `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees, or (always, even with `--no-git`) git tracks anything under `data/real` |
-| `data-real-guard.js`, `data-real-guard-selftest.js` | none | `data-real-guard ok` / `data-real-guard FAIL: data/real is tracked by git: <paths>`; `data-real-guard-selftest ok (7 checks)` | 1 if `git ls-files -- data/real` lists anything or itself fails; lists paths only, never reads the files. The selftest uses a throwaway repo with a fake file |
+| `data-real-guard.js`, `data-real-guard-selftest.js` | none | `data-real-guard ok` / `data-real-guard FAIL: data/real is tracked by git: <paths>`; `data-real-guard-selftest ok (20 checks)` | 1 if `git -C <fit-finder> ls-files` lists any path with a `data/real` segment (any case) or itself fails; inherited `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_OBJECT_DIRECTORY` are dropped first; lists paths only, never reads the files. The selftest uses a throwaway repo with a fake file |
 | `engine-scope.js`, `gate-selftest.js` | `--git <sha>` or `--files <base> <new>`; selftest: none | `engine-scope ok` / `engine-scope FAIL: <problems>`; `gate-selftest ok` | 1 if `engine/fit.js` differs from the base outside the `OPS` block and the `let fit;`..`return { fit,` gate block (line endings ignored), an OPS key changed, or an added line has Date/performance/location/http/fetch/require(/process |
 | `selftest.js` | none | `selftest ok` or `selftest FAIL: ...` | 1 on the first failure |
 
diff --git a/fit-finder/tools/data-real-guard-selftest.js b/fit-finder/tools/data-real-guard-selftest.js
index d7ab6b3..cb9334e 100644
--- a/fit-finder/tools/data-real-guard-selftest.js
+++ b/fit-finder/tools/data-real-guard-selftest.js
@@ -19,8 +19,8 @@ git(repo, 'add', 'fit-finder/README.md');
 const line = 'first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits 8 (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)';
 const ev = path.join(tmp, 'ev.md');
 fs.writeFileSync(ev, ['BASE-SHA: ae60341', 'BEFORE-LINE: ' + line, 'BEFORE: feature 17 of 29, wrong 2, no card 8, not-a-fit 0', 'PREDICTION-PM: x', 'PREDICTION-LEAD: y'].join('\n') + '\n');
-const gate = () => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8' });
-const guard = (cwd) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp } });
+const gate = (env = {}) => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8', env: { ...process.env, ...env } });
+const guard = (cwd, env = {}) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp, ...env } });
 let n = 0;
 const expect = (name, r, code, re) => {
   n++;
@@ -40,11 +40,35 @@ const t = trackedReal(ff);
 if (!t.ok || t.files.join() !== 'data/real/fake.jsonl') fail('trackedReal lists ' + JSON.stringify(t));
 n++;
 
-// 6. untrack again: passes again
+// 6-15. inherited git env vars that point git at another repo, index or tree must not hide the tracked file
+const other = path.join(tmp, 'other');
+fs.mkdirSync(other);
+git(other, 'init', '-q');
+const misleading = {
+  GIT_DIR: path.join(other, '.git'),
+  GIT_INDEX_FILE: path.join(tmp, 'empty-index'),
+  GIT_WORK_TREE: other,
+  GIT_COMMON_DIR: path.join(other, '.git'),
+  GIT_OBJECT_DIRECTORY: path.join(other, '.git', 'objects'),
+};
+for (const [k, v] of Object.entries(misleading)) {
+  expect(`${k} guard`, guard(ff, { [k]: v }), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
+  expect(`${k} gate`, gate({ [k]: v }), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
+}
+
+// 16. untrack again: passes again
 git(repo, 'rm', '-q', '--cached', 'fit-finder/data/real/fake.jsonl');
 expect('untracked again gate', gate(), 0, /^gate-check ok before/);
 
-// 7. fails closed outside a git repo (git ls-files errors)
+// 17-19. a case variant (data/REAL) is caught too; put straight in the index so the test does not depend on the disk's case rules
+const blob = git(repo, 'hash-object', '-w', 'fit-finder/data/real/fake.jsonl').stdout.trim();
+git(repo, 'update-index', '--add', '--cacheinfo', `100644,${blob},fit-finder/data/REAL/x.jsonl`);
+expect('case variant guard', guard(ff), 1, /data-real-guard FAIL: .*data\/REAL\/x\.jsonl/);
+expect('case variant gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/REAL\/x\.jsonl/);
+git(repo, 'update-index', '--force-remove', 'fit-finder/data/REAL/x.jsonl');
+expect('case variant removed gate', gate(), 0, /^gate-check ok before/);
+
+// 20. fails closed outside a git repo (git ls-files errors)
 const bare = path.join(tmp, 'not-a-repo');
 fs.mkdirSync(bare);
 expect('no repo guard', guard(bare), 1, /data-real-guard FAIL: git ls-files failed/);
diff --git a/fit-finder/tools/data-real-guard.js b/fit-finder/tools/data-real-guard.js
index 4e60565..a2acadd 100644
--- a/fit-finder/tools/data-real-guard.js
+++ b/fit-finder/tools/data-real-guard.js
@@ -1,10 +1,16 @@
 /* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
-   Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed). */
+   Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed).
+   Inherited GIT_DIR-style env vars are dropped so they cannot point git at another repo or index, and the data/real
+   segment is matched in any case (data/REAL on Windows is the same folder). */
 const { spawnSync } = require('child_process');
+const DROP = ['GIT_DIR', 'GIT_INDEX_FILE', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY'];
+const REAL = /(^|\/)data\/real(\/|$)/i;
 function trackedReal(dir) {
-  const r = spawnSync('git', ['ls-files', '--', 'data/real'], { cwd: dir, encoding: 'utf8' });
+  const env = { ...process.env };
+  for (const k of Object.keys(env)) if (DROP.includes(k.toUpperCase())) delete env[k];
+  const r = spawnSync('git', ['-C', dir, 'ls-files', '-z'], { cwd: dir, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
   if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
-  return { ok: true, files: r.stdout.split(/\r?\n/).filter(Boolean) };
+  return { ok: true, files: r.stdout.split('\0').filter((f) => f && REAL.test(f)) };
 }
 module.exports = { trackedReal };
 if (require.main === module) {
# F3 (Fit Finder half): the done check fails when data/real is tracked

studio-harness F3 (premortem 7): "the Fit Finder done check fails if data/real is git-tracked". Branch `harness/f3-data-real-guard`, based on `prompt-coach` fb26061. Run 2026-10-26 ~01:05Z on Ian's PC.

## What changed

- `fit-finder/tools/data-real-guard.js`: runs `git ls-files -- data/real` from `fit-finder/`; exit 1 if it lists anything, and exit 1 if git itself fails (fails closed). Lists paths only, never reads the files.
- `fit-finder/tools/gate-check.js` (the Fit Finder done/gate check) calls it on every run, even with `--no-git`, and adds `data/real is tracked by git: <paths>` to its FAIL reasons.
- `fit-finder/tools/data-real-guard-selftest.js`: test, written first. A throwaway git repo shaped like workiva gets copies of the real `gate-check.js` and `data-real-guard.js` and one fake file `fit-finder/data/real/fake.jsonl`. The real `data/real` is never opened.
- `fit-finder/tools/README.md`: the gate-check row names the new failure; one row for the guard and its selftest.

Choice logged: Fit Finder has no GOAL.md done line, so "the done check" is taken to be `tools/gate-check.js`, the only gate check script, and the guard is also runnable alone.

## Test run (commands from `fit-finder/`)

Red 1, guard not written: `node tools/data-real-guard-selftest.js` -> exit 1, `ENOENT ... copyfile ...tools\data-real-guard.js`.

Red 2, guard written but not called by gate-check (the join):
```
data-real-guard-selftest FAIL: tracked gate: want exit 1 matching /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/, got 0: gate-check ok before pending; before feature 17 of 29 wrong 2 no-card 8 not-a-fit 0
exit 1
```

Green, after the call in gate-check:
```
## data-real-guard-selftest
data-real-guard-selftest ok (7 checks)
exit 0
## gate-selftest
gate-selftest ok
exit 0
## data-real-guard on this checkout
data-real-guard ok
exit 0
```

The 7 checks: untracked file on disk passes (guard, gate); `git add -f` of the fake file fails (guard and gate, each naming the path; `trackedReal` lists exactly it); `git rm --cached` passes again; outside any repo the guard fails closed (`git ls-files failed`). On this checkout nothing under `data/real` is tracked.

## Round 2: the two Codex must-fixes (2026-10-26 ~05:40Z, Ian's PC)

The Codex judge of d007e0b (`docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md`) failed it on two must-fixes: inherited `GIT_INDEX_FILE` / `GIT_WORK_TREE` (and similar) make `git ls-files` print nothing and exit 0, and the case-sensitive `data/real` pathspec lets `data/REAL/...` past on Windows.

Fix in `data-real-guard.js`: git runs as `git -C <fit-finder> ls-files -z` with `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` removed from its environment (any case of the name), and the output is filtered with `/(^|\/)data\/real(\/|$)/i`, so a `data/real` segment in any case, at any depth under `fit-finder/`, fails.

Tests added first to the selftest (13 new checks, 20 in all):
- checks 6-15: with the fake file tracked, each of the five env vars set to point at a second throwaway repo (or an empty index path), guard and gate must still fail naming `data/real/fake.jsonl`;
- checks 17-19: `fit-finder/data/REAL/x.jsonl` put straight into the index with `git update-index --cacheinfo` (so the test does not depend on the disk's case rules) must fail guard and gate, and pass again once removed.

Red against the old guard (each new check run alone in a scratch copy): `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE` and the `data/REAL` case each got `exit 0: data-real-guard ok`. `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` did not hide the file even before the fix; their checks stay as regression guards, not proof of the fix.

Green after the fix:
```
## data-real-guard-selftest
data-real-guard-selftest ok (20 checks)
## gate-selftest
gate-selftest ok
## data-real-guard on this checkout
data-real-guard ok
```

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node fit-finder/tools/data-real-guard-selftest.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const {spawnSync}=require('child_process'),path=require('path'),os=require('os');
const cwd=path.resolve('fit-finder');
const base={...process.env};
for(const k of Object.keys(base)) if(k.toUpperCase().startsWith('GIT_')) delete base[k];
const configurations=[
 ['control',{}],
 ['config-count core.worktree',{GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'core.worktree',GIT_CONFIG_VALUE_0:os.tmpdir()}],
 ['config-parameters core.worktree',{GIT_CONFIG_PARAMETERS:\"'core.worktree=\"+os.tmpdir().replace(/\\\\/g,'/')+\"'\"}],
 ['config-count core.bare',{GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'core.bare',GIT_CONFIG_VALUE_0:'true'}],
 ['ceiling equal cwd',{GIT_CEILING_DIRECTORIES:cwd}],
 ['prefix unrelated',{GIT_PREFIX:'arbitrary/'}],
 ['implicit-work-tree 0',{GIT_IMPLICIT_WORK_TREE:'0'}],
 ['namespace unrelated',{GIT_NAMESPACE:'unrelated'}],
 ['literal-pathspecs',{GIT_LITERAL_PATHSPECS:'1'}],
 ['config-count sparse-checkout',{GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'core.sparseCheckout',GIT_CONFIG_VALUE_0:'true'}]
];
for(const [name,extra] of configurations) {
const r=spawnSync('git',['-C',cwd,'ls-files','-z','--','tools/data-real-guard.js'],{cwd,encoding:'utf8',env:{...base,...extra}});
console.log(JSON.stringify({name,status:r.status,safeProxyPaths:r.stdout,error:r.stderr}));
}
'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -LiteralPath 'fit-finder/tools/gate-selftest.js','fit-finder/tools/README.md'; git diff prompt-coach...HEAD -- fit-finder/tools docs/evidence" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 exited 1 in 479ms:
node:fs:3600
  return binding.mkdtemp(prefix, options.encoding);
                 ^

Error: EPERM: operation not permitted, mkdtemp 'C:\Users\teasp\AppData\Local\Temp\data-real-guard-XXXXXX'
    at Object.mkdtempSync (node:fs:3600:18)
    at Object.<anonymous> (C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard\fit-finder\tools\data-real-guard-selftest.js:5:16)
    at Module._compile (node:internal/modules/cjs/loader:1934:14)
    at Object..js (node:internal/modules/cjs/loader:2074:10)
    at Module.load (node:internal/modules/cjs/loader:1656:32)
    at Module._load (node:internal/modules/cjs/loader:1448:12)
    at wrapModuleLoad (node:internal/modules/cjs/loader:261:19)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47 {
  errno: -4048,
  code: 'EPERM',
  syscall: 'mkdtemp',
  path: 'C:\\Users\\teasp\\AppData\\Local\\Temp\\data-real-guard-XXXXXX'
}

Node.js v26.5.0

hook: PostToolUse
 succeeded in 962ms:
/* node tools/gate-selftest.js : exercises gate-check.js (--no-git, plus one git-mode engine-diff case) and engine-scope.js. Prints gate-selftest ok or the first failure. */
const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const gc = path.join(__dirname, 'gate-check.js');
const es = require('./engine-scope.js');
const fail = (m) => { console.log('gate-selftest FAIL: ' + m); process.exit(1); };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-selftest-'));
let n = 0;

// a score line; `cr` is the "first card right" number (differs from the split number on purpose)
const line = (R, F, W, N, K, cr) => `first card right: ${cr === undefined ? R + 3 : cr} of ${F + 4} that fit; wrong card ${W} (a); no card where one fits ${N} (b); card on a not-a-fit prompt ${K} (c); fit agreement 12 of 29; score 5; split: right feature first ${R} of ${F}, rightly none 3 (x)`;
const sum = (tag, R, F, W, N, K) => `${tag} feature ${R} of ${F}, wrong ${W}, no card ${N}, not-a-fit ${K}`;
function doc(o) {
  const b = o.b || [17, 29, 2, 8, 0], a = o.a;
  const L = ['BASE-SHA: ' + (o.sha || 'ae60341'), 'BEFORE-LINE: ' + line(...b), o.beforeSum || sum('BEFORE:', ...b)];
  if (!o.noPred) { if (!o.pmLate) L.push('PREDICTION-PM: x'); L.push('PREDICTION-LEAD: y'); }
  if (o.outcome && !a) L.push('OUTCOME: ' + o.outcome);
  if (o.reason) L.push('REASON: ' + o.reason);
  if (a) {
    L.push('AFTER-LINE: ' + line(...a), o.afterSum || sum('AFTER:', ...a));
    if (o.pmLate) L.push('PREDICTION-PM: x');
    L.push('OUTCOME: ' + o.outcome, 'REASON: ' + o.reason);
    if (o.pred) L.push('PREDICTION: ' + o.pred);
  }
  return L.join('\n') + '\n';
}
function run(stage, o, git) {
  const f = path.join(dir, 'ev' + (n++) + '.md');
  fs.writeFileSync(f, doc(o));
  const r = spawnSync('node', [gc, f, '--stage', stage].concat(git ? [] : ['--no-git']), { encoding: 'utf8' });
  return git ? r : r.status === 0;
}
const ok = (name, stage, o) => { if (!run(stage, o)) fail(name + ' should pass'); };
const bad = (name, stage, o) => { if (run(stage, o)) fail(name + ' should fail'); };

ok('before', 'before', {});
bad('before N0=5 no outcome', 'before', { b: [17, 29, 2, 5, 0] });
ok('before N0=5 inconclusive', 'before', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
bad('before N0=5 wrong reason', 'before', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'none' });
ok('final N0=5 inconclusive', 'final', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
bad('final N0=5 with after', 'final', { b: [17, 29, 2, 5, 0], a: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });

const B = [17, 29, 2, 8, 0];
ok('kept', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'held' });
bad('kept pred did not hold', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'did not hold' });
ok('reverted N', 'final', { b: B, a: [20, 29, 2, 7, 0], outcome: 'reverted', reason: 'no-card fall < 2 (8 to 7)', pred: 'did not hold' });
bad('kept when N fell 1', 'final', { b: B, a: [20, 29, 2, 7, 0], outcome: 'kept', reason: 'none', pred: 'held' });
ok('reverted W', 'final', { b: B, a: [20, 29, 3, 5, 0], outcome: 'reverted', reason: 'wrong card rose (2 to 3)', pred: 'did not hold' });
ok('reverted K', 'final', { b: B, a: [20, 29, 2, 5, 1], outcome: 'reverted', reason: 'not-a-fit card rose (0 to 1)', pred: 'did not hold' });
const all = [20, 29, 3, 8, 1], r1 = 'no-card fall < 2 (8 to 8)', r2 = 'wrong card rose (2 to 3)', r3 = 'not-a-fit card rose (0 to 1)';
ok('all three', 'final', { b: B, a: all, outcome: 'reverted', reason: [r1, r2, r3].join(' and '), pred: 'did not hold' });
bad('middle missing', 'final', { b: B, a: all, outcome: 'reverted', reason: [r1, r3].join(' and '), pred: 'did not hold' });
bad('first two swapped', 'final', { b: B, a: all, outcome: 'reverted', reason: [r2, r1, r3].join(' and '), pred: 'did not hold' });
bad('PM after AFTER-LINE', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'held', pmLate: true });
bad('summary disagrees', 'final', { b: B, a: [20, 29, 2, 6, 0], afterSum: sum('AFTER:', 21, 29, 2, 6, 0), outcome: 'kept', reason: 'none', pred: 'held' });
bad('summary from first card right', 'final', { b: B, a: [20, 29, 2, 6, 0, 24], afterSum: sum('AFTER:', 24, 33, 2, 6, 0), outcome: 'kept', reason: 'none', pred: 'held' });
ok('summary from split with differing first-card number', 'final', { b: B, a: [20, 29, 2, 6, 0, 24], outcome: 'kept', reason: 'none', pred: 'held' });

// git mode: engine/fit.js at BASE must be compared with HEAD (was a doubled path, always 'same')
const gr = run('before', { sha: '23757a5' }, true);
if (!/engine\/fit\.js differs from BASE/.test(gr.stdout)) fail('git mode: BASE with a different engine/fit.js should report that it differs; got: ' + gr.stdout.trim());

// engine-scope
const base = fs.readFileSync(path.join(root, 'engine/fit.js'), 'utf8').replace(/\r\n/g, '\n');
const crlf = (s) => s.replace(/\n/g, '\r\n');
const once = (s, a, b) => { const i = s.indexOf(a); if (i < 0) fail('anchor missing: ' + a); return s.slice(0, i) + b + s.slice(i + a.length); };
const opsAt = base.indexOf('    READ: /') + 11;
const gateAt = base.indexOf('    let fit;\n') + 14;
const inOps = base.slice(0, opsAt) + '  ' + base.slice(opsAt);              // a changed char inside OPS
const inGate = base.slice(0, gateAt) + ' ' + base.slice(gateAt);              // a changed char inside the gate block
const step = /STEP/.test(base) ? once(base, 'STEP', 'STEq') : fail('no STEP label in engine');
const expect = (name, got, empty) => { if (!!got.length === empty) fail('engine-scope ' + name + (empty ? ' should be empty: ' + got.join('; ') : ' should fail')); };
expect('same', es.check(base, base), true);
expect('ops change', es.check(base, inOps), true);
expect('gate change', es.check(base, inGate), true);
expect('STEP change', es.check(base, step), false);
const km = base.match(/^\s{4}([A-Z]+):/m)[1];
expect('deleted key', es.check(base, once(base, '    ' + km + ':', '    ' + km.toLowerCase() + 'x:')), false);
expect('Date in OPS', es.check(base, base.slice(0, opsAt) + '/*Date.now()*/' + base.slice(opsAt)), false);
expect('crlf vs lf', es.check(crlf(base), base), true);
const mixed = (s) => s.split('\n').map((l, i, all) => i % 2 && i < all.length - 1 ? l + '\r' : l).join('\n');
expect('lf vs mixed ops change', es.check(base, mixed(inOps)), true);
expect('mixed STEP', es.check(base, mixed(step)), false);
console.log('gate-selftest ok');
# fit-finder/tools

Small scripts for the BCA run. Run them from `fit-finder/` (paths are relative to where you run them). Every script exits non-zero on a problem. `node tools/selftest.js` exercises all of them on `tools/fixtures/` and prints `selftest ok`.

`L` below is the run ledger `<repo root>/.ledger/2026-10-22-fit-finder-bca` (git-ignored; the env var `FF_LEDGER` overrides it, used by the self-test only).

| Script | Arguments | Prints | Exit |
|---|---|---|---|
| `check-set.js` | `<prompts> <gold\|-> <catalogue> [--not-range LO HI]` | `rows N, per area FR a GRC b SUS c GEN d, gold M, not K, unknown cards U` | 1 on 0 rows, a row lacking string `id`/`task`, a repeated id, an `area` not in FR/GRC/SUS/GEN. With gold: a missing or extra gold id, `fit` not good/partial/not, `cards` not an array, a `not` row with cards, a card id not in the catalogue; with `--not-range`, K outside LO..HI |
| `nearcopy.js` | `<fresh> <real dir> [--catalogue <catalogue>]` | `files read F, rows read R, windows W`, `control: hit`, then `hits: none` or `hits: <fresh ids>`. Never prints text | 1 if F, R or W is 0, the positive control misses, or any hit. 5-word windows over every string value of every real row; with `--catalogue` a fresh row also hits on a window shared with any card's `try` |
| `agree.js` | `<frozen> <final>` | `N <n> D <d> agreement <pct> PASS\|FAIL` | 1 if an id set differs, a differing row (fit or sorted cards) lacks `"by":"ian"`, an unchanged row has it, or (N-D)/N < 0.845 (N=40: D <= 6) |
| `card-view.js` | `<catalogue> <out>` | `cards N` | writes `{"useCases":[...]}` with every card minus `match` and `ops` (`try` kept) |
| `label-sheet.js` | `<draft> <card-view> <out>`; or `--verify <sheet> <draft> <catalogue>` | `label-sheet rows N`; or `label-sheet ok` | 1 on bad input; `--verify` rebuilds the sheet from the draft and catalogue and needs a byte-for-byte match |
| `label-handoff.js` | `[--check] <looks file> <sheet> <ian batch json> <catalogue> <out frozen> <out gold>` | `label-handoff ok rows N changed D`, or `STOP: <reason>` | 3 on any `STOP`. `--check` recomputes both outputs in memory and exits 1 unless they equal the files byte for byte |
| `score-once.js` | `<name> <prompts> <gold> [--scorer <path>]` | the scorer's stdout (from `L/score-<name>.out` on a repeat) | the scorer's status. 3 with `STOP: unknown outcome` if `L/score-<name>.started` exists without `.out` |
| `keep-check.js` | `<EV>` | `keep-check ok <outcome>` | 1 if the rule, the written REASON or the git state disagree |
| `ops-check.js` | `<base sha>` | `ops-check ok <n> cards changed` | 1 on any violation |
| `diag-nocard.js`, `diag-selftest.js` | `[--engine <path>]` (self-test only); selftest: none (needs `FF_LEDGER`) | `diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K`; selftest `diag-selftest ok` | 1 with `INVALID: ...` if tune wrong > 4, tune not-a-fit > BASE_K or half A wrong > 0; 2 on bad input. Reads only the tune set and half A |
| `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees, or (always, even with `--no-git`) git tracks anything under `data/real` |
| `data-real-guard.js`, `data-real-guard-selftest.js` | none | `data-real-guard ok` / `data-real-guard FAIL: data/real is tracked by git: <paths>`; `data-real-guard-selftest ok (20 checks)` | 1 if `git -C <fit-finder> ls-files` lists any path with a `data/real` segment (any case) or itself fails; inherited `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_OBJECT_DIRECTORY` are dropped first; lists paths only, never reads the files. The selftest uses a throwaway repo with a fake file |
| `engine-scope.js`, `gate-selftest.js` | `--git <sha>` or `--files <base> <new>`; selftest: none | `engine-scope ok` / `engine-scope FAIL: <problems>`; `gate-selftest ok` | 1 if `engine/fit.js` differs from the base outside the `OPS` block and the `let fit;`..`return { fit,` gate block (line endings ignored), an OPS key changed, or an added line has Date/performance/location/http/fetch/require(/process |
| `selftest.js` | none | `selftest ok` or `selftest FAIL: ...` | 1 on the first failure |

## Details

**label-handoff.** The PICK is ONE line of space-separated `<id>=<label>` tokens after a `PICK` marker (on the same line, or the next non-empty line). Labels: a catalogue card id, `none`, `not`. Every sheet id (`### <id> | <area>` headings) appears exactly once. The batch needs a non-empty `words`, a boolean `accepted`, `sheetSha256` equal to the sheet's sha256 (and the sheet must match `L/label-sheet.sha256` if that exists), `changes[].id` in the sheet with a legal `label`, and empty `changes` when `accepted` is true. Frozen rows: `{"id","fit","cards","by":"pm"}` (card id: `good` + `[id]`; `none`: `good` + `[]`; `not`: `not` + `[]`). Gold = frozen with the changes applied and `"by":"ian"` on exactly the changed rows (a change equal to the PM label is ignored).

**score-once.** Runs `node tests/synth-score.js <prompts> <gold>` from `fit-finder/` (or `--scorer`, self-test only) at most once per `<name>`. First call: writes `.started`, runs, writes `.out` atomically (first line `STATUS <n>`, then stdout), prints stdout, exits with the scorer's status. Later calls print the saved stdout and exit with the saved status without running anything. Fresh/holdout/blind lines are copied only from `L/score-<name>.out`.

**keep-check.** Reads `BEFORE-LINE`, `AFTER-LINE`, `OUTCOME`, `REASON` from the evidence doc; R = number after `right feature first `, S = number after `score `. Kept iff R1 >= R0 + 1 and S1 <= S0. REASON must be `none` (kept) or `R gain < 1 (R0 to R1)` / `S rose (S0 to S1)` / `R gain < 1 and S rose (R0 to R1; S0 to S1)`. Git check against the commit whose subject starts `task 11:`: reverted needs `node tests/match-frozen.js --base <sha>` to pass; kept needs it to pass with `--allow ops` and fail without.

**ops-check.** Compares `data/catalogue.json` at `<base sha>` with the working tree: same cards in the same order, every field except `ops` equal, each `ops` starts with the old `ops` (append only), every added value is in `AI_OPS` (`engine/fit.js`, the list `tests/catalogue.test.js` checks), and at least one card changed.
diff --git a/docs/evidence/2026-10-26-f3-data-real-guard.md b/docs/evidence/2026-10-26-f3-data-real-guard.md
new file mode 100644
index 0000000..2479664
--- /dev/null
+++ b/docs/evidence/2026-10-26-f3-data-real-guard.md
@@ -0,0 +1,59 @@
+# F3 (Fit Finder half): the done check fails when data/real is tracked
+
+studio-harness F3 (premortem 7): "the Fit Finder done check fails if data/real is git-tracked". Branch `harness/f3-data-real-guard`, based on `prompt-coach` fb26061. Run 2026-10-26 ~01:05Z on Ian's PC.
+
+## What changed
+
+- `fit-finder/tools/data-real-guard.js`: runs `git ls-files -- data/real` from `fit-finder/`; exit 1 if it lists anything, and exit 1 if git itself fails (fails closed). Lists paths only, never reads the files.
+- `fit-finder/tools/gate-check.js` (the Fit Finder done/gate check) calls it on every run, even with `--no-git`, and adds `data/real is tracked by git: <paths>` to its FAIL reasons.
+- `fit-finder/tools/data-real-guard-selftest.js`: test, written first. A throwaway git repo shaped like workiva gets copies of the real `gate-check.js` and `data-real-guard.js` and one fake file `fit-finder/data/real/fake.jsonl`. The real `data/real` is never opened.
+- `fit-finder/tools/README.md`: the gate-check row names the new failure; one row for the guard and its selftest.
+
+Choice logged: Fit Finder has no GOAL.md done line, so "the done check" is taken to be `tools/gate-check.js`, the only gate check script, and the guard is also runnable alone.
+
+## Test run (commands from `fit-finder/`)
+
+Red 1, guard not written: `node tools/data-real-guard-selftest.js` -> exit 1, `ENOENT ... copyfile ...tools\data-real-guard.js`.
+
+Red 2, guard written but not called by gate-check (the join):
+```
+data-real-guard-selftest FAIL: tracked gate: want exit 1 matching /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/, got 0: gate-check ok before pending; before feature 17 of 29 wrong 2 no-card 8 not-a-fit 0
+exit 1
+```
+
+Green, after the call in gate-check:
+```
+## data-real-guard-selftest
+data-real-guard-selftest ok (7 checks)
+exit 0
+## gate-selftest
+gate-selftest ok
+exit 0
+## data-real-guard on this checkout
+data-real-guard ok
+exit 0
+```
+
+The 7 checks: untracked file on disk passes (guard, gate); `git add -f` of the fake file fails (guard and gate, each naming the path; `trackedReal` lists exactly it); `git rm --cached` passes again; outside any repo the guard fails closed (`git ls-files failed`). On this checkout nothing under `data/real` is tracked.
+
+## Round 2: the two Codex must-fixes (2026-10-26 ~05:40Z, Ian's PC)
+
+The Codex judge of d007e0b (`docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md`) failed it on two must-fixes: inherited `GIT_INDEX_FILE` / `GIT_WORK_TREE` (and similar) make `git ls-files` print nothing and exit 0, and the case-sensitive `data/real` pathspec lets `data/REAL/...` past on Windows.
+
+Fix in `data-real-guard.js`: git runs as `git -C <fit-finder> ls-files -z` with `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` removed from its environment (any case of the name), and the output is filtered with `/(^|\/)data\/real(\/|$)/i`, so a `data/real` segment in any case, at any depth under `fit-finder/`, fails.
+
+Tests added first to the selftest (13 new checks, 20 in all):
+- checks 6-15: with the fake file tracked, each of the five env vars set to point at a second throwaway repo (or an empty index path), guard and gate must still fail naming `data/real/fake.jsonl`;
+- checks 17-19: `fit-finder/data/REAL/x.jsonl` put straight into the index with `git update-index --cacheinfo` (so the test does not depend on the disk's case rules) must fail guard and gate, and pass again once removed.
+
+Red against the old guard (each new check run alone in a scratch copy): `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE` and the `data/REAL` case each got `exit 0: data-real-guard ok`. `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` did not hide the file even before the fix; their checks stay as regression guards, not proof of the fix.
+
+Green after the fix:
+```
+## data-real-guard-selftest
+data-real-guard-selftest ok (20 checks)
+## gate-selftest
+gate-selftest ok
+## data-real-guard on this checkout
+data-real-guard ok
+```
diff --git a/docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md b/docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md
new file mode 100644
index 0000000..8923fa6
--- /dev/null
+++ b/docs/evidence/2026-10-26-f3-fit-finder-codex-judge.md
@@ -0,0 +1,1692 @@
+# F3 (Fit Finder half): fresh Codex judge, 2026-10-26
+
+Command (from Ian's PC, codex-cli 0.163.0, branch harness/f3-data-real-guard at d007e0b; the prompt is echoed at the top of the output):
+
+```
+codex exec --sandbox read-only --ephemeral -C "C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard" "$(cat prompt.txt)" < /dev/null
+```
+
+Result: **Verdict: FAIL**, two must-fixes: (1) the guard inherits GIT_INDEX_FILE / GIT_WORK_TREE, which can make `git ls-files` print nothing and exit 0; (2) the `data/real` pathspec is case-sensitive, so on Windows `data/REAL/...` gets past it. The join with gate-check was judged sound in every mode, and the selftest not vacuous. The selftest could not run in the read-only sandbox (mkdtemp EPERM). Not fixed in this commit.
+
+## Full output
+
+````
+Reading additional input from stdin...
+OpenAI Codex v0.163.0
+--------
+workdir: C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+model: gpt-6.1-sol
+provider: openai
+approval: on-request
+sandbox: read-only
+reasoning effort: high
+reasoning summaries: none
+session id: 01a17667-870b-76b1-97fe-38ec9708b1ee
+--------
+user
+You are a fresh, independent judge. Review branch harness/f3-data-real-guard (commit d007e0b) of this repo. Read-only: do not edit files.
+
+HARD RULE: never open, list, cat, grep or git-show anything under fit-finder/data/ or any data/real path (real customer data and labels). Read only: fit-finder/tools/gate-check.js, fit-finder/tools/data-real-guard.js, fit-finder/tools/data-real-guard-selftest.js, fit-finder/tools/gate-selftest.js, fit-finder/tools/README.md, docs/evidence/2026-10-26-f3-data-real-guard.md, and git metadata (git log, git diff prompt-coach...HEAD -- fit-finder/tools docs/evidence). The sandbox is read-only, so the selftests may not run (they write to the temp dir); if so, judge from the code and the recorded output in the evidence file, and say so.
+
+Requirement (studio-harness F3): the Fit Finder done check (fit-finder/tools/gate-check.js) must fail whenever git tracks anything under data/real (that is, `git ls-files -- data/real` run from fit-finder/ prints anything), including failing when git itself errors. It must be proved by a test written first that uses a throwaway repo as the fixture, never the real data.
+
+Answer:
+1. Does gate-check.js fail whenever git tracks anything under fit-finder/data/real, in every mode (--no-git, --stage before, --stage final, any outcome)? Does it fail when git errors (not a repo, git missing, other failure)?
+2. Does data-real-guard-selftest.js prove it with a throwaway repo, testing the real gate-check join and not only the helper? Is any check vacuous (true by construction)?
+3. Try your own bypasses and name each one with its result: for example the cwd it runs from, paths with spaces or unusual names, files staged but not committed, files in subfolders, case differences on Windows, a data/real symlink, nested repos or submodules, GIT_DIR/GIT_WORK_TREE or similar env vars, sparse checkout or skip-worktree, a data/real path elsewhere in the repo, early exits in gate-check before the guard runs, the order of checks.
+
+Must-fix rule: a must-fix is anything that ordinary use or an honest mistake gets past. A deliberate trick counts as a must-fix only if the fix is small. List must-fixes first, then minor notes.
+
+End your reply with exactly one final line: "Verdict: PASS" (no must-fix) or "Verdict: FAIL" (one or more must-fixes).
+warning: loading hooks from both C:\Users\teasp\.codex\hooks.json and C:\Users\teasp\.codex\config.toml; prefer a single representation for this layer
+2026-10-26T04:11:03.900046Z ERROR codex_rmcp_client::oauth::refresh_transaction: error=failed to refresh OAuth tokens for server openart: OAuth refresh token was rejected: Server returned error response: invalid_grant: The refresh token is invalid, expired, or revoked.
+hook: SessionStart
+hook: SessionStart
+hook: SessionStart
+hook: SessionStart Completed
+hook: SessionStart Completed
+hook: SessionStart Completed
+hook: UserPromptSubmit
+hook: UserPromptSubmit Completed
+codex
+Time budget: about 15 minutes. I’ll review the allowed files and branch metadata, then try isolated bypass checks where the read-only sandbox permits them. I’ll leave all customer-data paths untouched.
+hook: PreToolUse
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node "C:/Users/teasp/Documents/studio-harness/plugin/scripts/live_copy.mjs"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 670ms:
+{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"LIVE COPY NOT UPDATED: fetch failed; 0 behind origin/main; this session runs old harness rules; say this in your first line to the user"}}
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PreToolUse
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node "C:/Users/teasp/Documents/studio-harness/plugin/scripts/goal_start.mjs"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 335ms:
+{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"NO GOAL.md in C:\\Users\\teasp\\Documents\\workiva\\.claude\\worktrees\\f3-data-real-guard: a hand-off from here will be refused by town-launch until Ian approves one."}}
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PreToolUse
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node "C:/Users/teasp/Documents/studio-harness/bin/brain.mjs" context' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 903ms:
+CHECKS
+Run node --test --test-name-pattern='git.exe|gh.exe' test/slip_guard.test.mjs; in a run with no slip, git.exe push, GIT.EXE push, a full path to git (forward or back slashes) and a full path to gh.exe pr merge must each exit 2. [2026-10-13-slip-guard-misses-git-exe]
+Run node --test --test-name-pattern='attached -C' test/slip_guard.test.mjs; from a work-branch repo, git -C<main repo> merge and git -C\"<main repo>\" merge must exit 2 while the same merge without -C exits 0. [2026-10-13-slip-guard-attached-c-merge]
+Run node --test --test-name-pattern='detail prefers the spawn error code' test/evalrun.test.mjs; a run whose spawn fails must name the error code in its detail, never UNKNOWN. [2026-09-06-spawn-failure-detail-carries-no-error-message]
+ASK
+node "C:\Users\teasp\Documents\studio-harness\bin\brain.mjs" query <words> | show <page-id> | gate "<task>" | why <page>
+
+hook: PostToolUse
+hook: PostToolUse Completed
+codex
+The required startup checks report that the harness refresh failed and this worktree has no GOAL.md. Neither blocks this read-only review. I’m applying `$superpowers:using-superpowers`, `$task-observer`, and `$superpowers:verification-before-completion`; I won’t write review notes into the repo or shared memory.
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git log -5 --oneline --decorate' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath "C:/Users/teasp/.agents/skills/task-observer/SKILL.md"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath "C:/Users/teasp/.codex/plugins/cache/superpowers-marketplace/superpowers/7.0.1/skills/using-superpowers/SKILL.md"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff prompt-coach...HEAD -- fit-finder/tools docs/evidence' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 662ms:
+d007e0b (HEAD -> harness/f3-data-real-guard, origin/harness/f3-data-real-guard) fit-finder: gate-check fails when data/real is tracked by git (studio-harness F3)
+fb26061 (origin/backup/prompt-coach-before-prompt-coach-sod-conflict-2026-10-25) Merge prompt-coach-c3-sandbox: C3 sandbox test (C3a 13/24 MISS, C3b 0/24 PASS, C3c 58 vs 63 MISS), evidence, next talk prompt
+156034f (origin/prompt-coach-c3-sandbox, prompt-coach-c3-sandbox) Prompt coach C3: next talk prompt (after C3 miss)
+2aec56c Prompt coach C3: README wording (final review note: "never run" read as current)
+ab6e654 Prompt coach C3 sandbox: results (C3a/C3b/C3c)
+
+hook: PostToolUse
+ succeeded in 483ms:
+diff --git a/docs/evidence/2026-10-26-f3-data-real-guard.md b/docs/evidence/2026-10-26-f3-data-real-guard.md
+new file mode 100644
+index 0000000..b7329e2
+--- /dev/null
++++ b/docs/evidence/2026-10-26-f3-data-real-guard.md
+@@ -0,0 +1,37 @@
++# F3 (Fit Finder half): the done check fails when data/real is tracked
++
++studio-harness F3 (premortem 7): "the Fit Finder done check fails if data/real is git-tracked". Branch `harness/f3-data-real-guard`, based on `prompt-coach` fb26061. Run 2026-10-26 ~01:05Z on Ian's PC.
++
++## What changed
++
++- `fit-finder/tools/data-real-guard.js`: runs `git ls-files -- data/real` from `fit-finder/`; exit 1 if it lists anything, and exit 1 if git itself fails (fails closed). Lists paths only, never reads the files.
++- `fit-finder/tools/gate-check.js` (the Fit Finder done/gate check) calls it on every run, even with `--no-git`, and adds `data/real is tracked by git: <paths>` to its FAIL reasons.
++- `fit-finder/tools/data-real-guard-selftest.js`: test, written first. A throwaway git repo shaped like workiva gets copies of the real `gate-check.js` and `data-real-guard.js` and one fake file `fit-finder/data/real/fake.jsonl`. The real `data/real` is never opened.
++- `fit-finder/tools/README.md`: the gate-check row names the new failure; one row for the guard and its selftest.
++
++Choice logged: Fit Finder has no GOAL.md done line, so "the done check" is taken to be `tools/gate-check.js`, the only gate check script, and the guard is also runnable alone.
++
++## Test run (commands from `fit-finder/`)
++
++Red 1, guard not written: `node tools/data-real-guard-selftest.js` -> exit 1, `ENOENT ... copyfile ...tools\data-real-guard.js`.
++
++Red 2, guard written but not called by gate-check (the join):
++```
++data-real-guard-selftest FAIL: tracked gate: want exit 1 matching /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/, got 0: gate-check ok before pending; before feature 17 of 29 wrong 2 no-card 8 not-a-fit 0
++exit 1
++```
++
++Green, after the call in gate-check:
++```
++## data-real-guard-selftest
++data-real-guard-selftest ok (7 checks)
++exit 0
++## gate-selftest
++gate-selftest ok
++exit 0
++## data-real-guard on this checkout
++data-real-guard ok
++exit 0
++```
++
++The 7 checks: untracked file on disk passes (guard, gate); `git add -f` of the fake file fails (guard and gate, each naming the path; `trackedReal` lists exactly it); `git rm --cached` passes again; outside any repo the guard fails closed (`git ls-files failed`). On this checkout nothing under `data/real` is tracked.
+diff --git a/fit-finder/tools/README.md b/fit-finder/tools/README.md
+index 4d51b38..9e07528 100644
+--- a/fit-finder/tools/README.md
++++ b/fit-finder/tools/README.md
+@@ -16,7 +16,8 @@ Small scripts for the BCA run. Run them from `fit-finder/` (paths are relative t
+ | `keep-check.js` | `<EV>` | `keep-check ok <outcome>` | 1 if the rule, the written REASON or the git state disagree |
+ | `ops-check.js` | `<base sha>` | `ops-check ok <n> cards changed` | 1 on any violation |
+ | `diag-nocard.js`, `diag-selftest.js` | `[--engine <path>]` (self-test only); selftest: none (needs `FF_LEDGER`) | `diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K`; selftest `diag-selftest ok` | 1 with `INVALID: ...` if tune wrong > 4, tune not-a-fit > BASE_K or half A wrong > 0; 2 on bad input. Reads only the tune set and half A |
+-| `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees |
++| `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees, or (always, even with `--no-git`) git tracks anything under `data/real` |
++| `data-real-guard.js`, `data-real-guard-selftest.js` | none | `data-real-guard ok` / `data-real-guard FAIL: data/real is tracked by git: <paths>`; `data-real-guard-selftest ok (7 checks)` | 1 if `git ls-files -- data/real` lists anything or itself fails; lists paths only, never reads the files. The selftest uses a throwaway repo with a fake file |
+ | `engine-scope.js`, `gate-selftest.js` | `--git <sha>` or `--files <base> <new>`; selftest: none | `engine-scope ok` / `engine-scope FAIL: <problems>`; `gate-selftest ok` | 1 if `engine/fit.js` differs from the base outside the `OPS` block and the `let fit;`..`return { fit,` gate block (line endings ignored), an OPS key changed, or an added line has Date/performance/location/http/fetch/require(/process |
+ | `selftest.js` | none | `selftest ok` or `selftest FAIL: ...` | 1 on the first failure |
+ 
+diff --git a/fit-finder/tools/data-real-guard-selftest.js b/fit-finder/tools/data-real-guard-selftest.js
+new file mode 100644
+index 0000000..d7ab6b3
+--- /dev/null
++++ b/fit-finder/tools/data-real-guard-selftest.js
+@@ -0,0 +1,53 @@
++/* node tools/data-real-guard-selftest.js : exercises data-real-guard.js and its call from gate-check.js in a throwaway git repo
++   (fake files only; the real data/real is never read). Prints data-real-guard-selftest ok or the first failure. */
++const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
++const fail = (m) => { console.log('data-real-guard-selftest FAIL: ' + m); process.exit(1); };
++const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-real-guard-'));
++const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
++
++// throwaway repo shaped like workiva: <repo>/fit-finder/tools/{gate-check,data-real-guard}.js copied from this checkout
++const repo = path.join(tmp, 'repo'), ff = path.join(repo, 'fit-finder');
++fs.mkdirSync(path.join(ff, 'tools'), { recursive: true });
++fs.mkdirSync(path.join(ff, 'data', 'real'), { recursive: true });
++for (const f of ['gate-check.js', 'data-real-guard.js']) fs.copyFileSync(path.join(__dirname, f), path.join(ff, 'tools', f));
++if (git(repo, 'init', '-q').status !== 0) fail('git init');
++fs.writeFileSync(path.join(ff, 'data', 'real', 'fake.jsonl'), '{"fake":"not real data"}\n');
++fs.writeFileSync(path.join(ff, 'README.md'), 'x\n');
++git(repo, 'add', 'fit-finder/README.md');
++
++// a valid before-stage evidence doc (no-card 8, so no OUTCOME needed)
++const line = 'first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits 8 (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)';
++const ev = path.join(tmp, 'ev.md');
++fs.writeFileSync(ev, ['BASE-SHA: ae60341', 'BEFORE-LINE: ' + line, 'BEFORE: feature 17 of 29, wrong 2, no card 8, not-a-fit 0', 'PREDICTION-PM: x', 'PREDICTION-LEAD: y'].join('\n') + '\n');
++const gate = () => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8' });
++const guard = (cwd) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp } });
++let n = 0;
++const expect = (name, r, code, re) => {
++  n++;
++  if (r.status !== code || !re.test(r.stdout)) fail(`${name}: want exit ${code} matching ${re}, got ${r.status}: ${(r.stdout + r.stderr).trim()}`);
++};
++
++// 1-2. control: data/real exists on disk but is untracked, so guard and done check pass
++expect('untracked guard', guard(ff), 0, /^data-real-guard ok/);
++expect('untracked gate', gate(), 0, /^gate-check ok before/);
++
++// 3-5. tracked: git add a file under data/real, and both fail naming it
++git(repo, 'add', '-f', 'fit-finder/data/real/fake.jsonl');
++expect('tracked guard', guard(ff), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
++expect('tracked gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
++const { trackedReal } = require(path.join(ff, 'tools', 'data-real-guard.js'));
++const t = trackedReal(ff);
++if (!t.ok || t.files.join() !== 'data/real/fake.jsonl') fail('trackedReal lists ' + JSON.stringify(t));
++n++;
++
++// 6. untrack again: passes again
++git(repo, 'rm', '-q', '--cached', 'fit-finder/data/real/fake.jsonl');
++expect('untracked again gate', gate(), 0, /^gate-check ok before/);
++
++// 7. fails closed outside a git repo (git ls-files errors)
++const bare = path.join(tmp, 'not-a-repo');
++fs.mkdirSync(bare);
++expect('no repo guard', guard(bare), 1, /data-real-guard FAIL: git ls-files failed/);
++
++fs.rmSync(tmp, { recursive: true, force: true });
++console.log(`data-real-guard-selftest ok (${n} checks)`);
+diff --git a/fit-finder/tools/data-real-guard.js b/fit-finder/tools/data-real-guard.js
+new file mode 100644
+index 0000000..4e60565
+--- /dev/null
++++ b/fit-finder/tools/data-real-guard.js
+@@ -0,0 +1,15 @@
++/* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
++   Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed). */
++const { spawnSync } = require('child_process');
++function trackedReal(dir) {
++  const r = spawnSync('git', ['ls-files', '--', 'data/real'], { cwd: dir, encoding: 'utf8' });
++  if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
++  return { ok: true, files: r.stdout.split(/\r?\n/).filter(Boolean) };
++}
++module.exports = { trackedReal };
++if (require.main === module) {
++  const t = trackedReal(process.cwd());
++  if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
++  if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
++  console.log('data-real-guard ok');
++}
+diff --git a/fit-finder/tools/gate-check.js b/fit-finder/tools/gate-check.js
+index 54ffe57..6d691d4 100644
+--- a/fit-finder/tools/gate-check.js
++++ b/fit-finder/tools/gate-check.js
+@@ -13,6 +13,10 @@ const get = (tag) => {
+   return i < 0 ? null : { i, v: lines[i].slice(tag.length).trim() };
+ };
+ const bad = [];
++// always, even with --no-git: real data must never be tracked (studio-harness F3)
++const real = require('./data-real-guard.js').trackedReal(root);
++if (!real.ok) bad.push(real.error);
++else if (real.files.length) bad.push('data/real is tracked by git: ' + real.files.join(', '));
+ function parse(text) {
+   const m = (re) => { const x = re.exec(text); return x ? +x[1] : NaN; };
+   const s = /split: right feature first (\d+) of (\d+)/.exec(text);
+
+hook: PostToolUse
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath "C:/Users/teasp/.codex/plugins/cache/superpowers-marketplace/superpowers/7.0.1/skills/verification-before-completion/SKILL.md"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 1250ms:
+---
+name: using-superpowers
+description: Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions
+---
+
+<SUBAGENT-STOP>
+If you were dispatched as a subagent to execute a specific task, ignore this skill.
+</SUBAGENT-STOP>
+
+<EXTREMELY-IMPORTANT>
+If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.
+
+IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
+
+This is not negotiable. You cannot rationalize your way out of this.
+</EXTREMELY-IMPORTANT>
+
+## The Rule
+
+**Invoke relevant or requested skills BEFORE any response or action** �?" including clarifying questions, exploring the codebase, or checking files. If it turns out wrong for the situation, you don't have to use it.
+
+**Before entering plan mode:** if you haven't already brainstormed, invoke the brainstorming skill first.
+
+Then announce "Using [skill] to [purpose]" and follow the skill exactly. If it has a checklist, create a todo per item.
+
+## Skill Priority
+
+When multiple skills apply, process skills come first �?" they set the approach, then implementation skills (frontend-design, etc.) carry it out. Brainstorming and systematic-debugging are Superpowers' most common process skills, but the rule holds for any of them.
+
+- "Let's build X" �+' superpowers:brainstorming first, then implementation skills.
+- "Fix this bug" �+' superpowers:systematic-debugging first, then domain skills.
+
+## Red Flags
+
+These thoughts mean STOP�?"you're rationalizing:
+
+| Thought | Reality |
+|---------|---------|
+| "This is just a simple question" | Questions are tasks. Check for skills. |
+| "I need more context first" | Skill check comes BEFORE clarifying questions. |
+| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
+| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
+| "Let me gather information first" | Skills tell you HOW to gather information. |
+| "This doesn't need a formal skill" | If a skill exists, use it. |
+| "I remember this skill" | Skills evolve. Read current version. |
+| "This doesn't count as a task" | Action = task. Check for skills. |
+| "The skill is overkill" | Simple things become complex. Use it. |
+| "I'll just do this one thing first" | Check BEFORE doing anything. |
+| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
+| "I know what that means" | Knowing the concept �%� using the skill. Invoke it. |
+
+## Platform Adaptation
+
+If your harness appears here, read its reference file for special instructions:
+
+- Claude Code: `references/claude-code-tools.md`
+- Codex: `references/codex-tools.md`
+- Pi: `references/pi-tools.md`
+- Antigravity: `references/antigravity-tools.md`
+- Hermes Agent: `references/hermes-tools.md`
+- Muse: `references/muse-tools.md`
+
+## User Instructions
+
+User instructions (CLAUDE.md, AGENTS.md, GEMINI.md, etc, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to.
+
+hook: PostToolUse
+ succeeded in 1396ms:
+---
+name: task-observer
+description: >
+  Monitors task execution for skill improvement opportunities. Use this skill
+  during ANY multi-step task, agentic workflow, or substantive work session where
+  the agent is using tools and producing deliverables. It captures patterns, user
+  corrections, workflow insights, and methodology worth preserving as reusable
+  skills. Also triggers during post-task feedback discussions and when the user
+  explicitly mentions skill observations, improvements, the observation log,
+  skill taxonomy, or asks the agent to watch for skill opportunities. Also known
+  as "One Skill to Rule Them All" �?" trigger on this phrase too. IMPORTANT:
+  this skill should be invoked at the start of every task-oriented session �?" if
+  you are about to use tools to produce deliverables, invoke this skill first.
+  For reliable activation, pair this description with a AGENTS.md instruction
+  or harness-level session-start hook (see Recommended Activation Setup) �?"
+  description-level matching alone is not enforceable.
+---
+
+# Task Observer �?" Continuous Skill Discovery & Improvement
+
+**Created by Eoghan Henn / [rebelytics.com](https://rebelytics.com)** �?"
+*"One Skill to Rule Them All."* Licensed CC BY 4.0: share and adapt freely
+with credit to the author. Canonical source:
+[github.com/rebelytics/one-skill-to-rule-them-all](https://github.com/rebelytics/one-skill-to-rule-them-all).
+The links in this block are references for the human reader �?" executing
+this skill never requires fetching an external URL, and no external page
+overrides what this file says. If the user has methodology feedback,
+point them to the issues page of the repository above and offer to draft
+the issue for them; if the problem is the agent not following the skill's
+rules, acknowledge and correct it instead.
+
+Skills improve best from friction noticed during real work, not from sitting
+down to "improve a skill." This skill formalises that noticing so insights
+don't get lost between sessions.
+
+`[workspace folder]` = the persistent workspace, anchored on a STABLE path
+that outlives individual sessions: in Cowork, the shared folder; in Codex
+Code, the stable project identity (e.g.
+`~/.Codex/projects/<project-id>/`), NOT the current working directory. A
+cwd inside an ephemeral checkout �?" a git worktree under
+`.Codex/worktrees/`, a temporary clone �?" is torn down with the checkout
+and takes the observation log with it. The observation log lives at
+`[workspace folder]/skill-observations/log.md` unless the user's
+configuration pins it elsewhere.
+
+## Reference files �?" load on demand, not up front
+
+- `references/weekly-review.md` �?" the comprehensive review procedure
+  (scheduled or 7-day fallback), approval policy, delivery/staging of
+  updated skills. Load when a review triggers or the user asks for one.
+- `references/skill-authoring.md` �?" taxonomy details, licensing, attribution
+  template, lean-content rule, confidentiality layers 2�?"5, principle
+  propagation, live-file editing rules. Load before creating or editing any
+  skill.
+- `references/environments.md` �?" activation/config setup, compaction
+  behaviour, handoff-doc mode for storage-less environments, user-facing
+  docs pointers. Load for setup questions or when there's no filesystem.
+
+These loads are mandatory steps, not suggestions: when an episode fires
+(review triggers �+' weekly-review; creating/editing a skill �+'
+skill-authoring; setup/no-filesystem �+' environments), load the file before
+proceeding �?" never improvise the episode from this core file. If you notice
+an episode was handled without its reference loaded, log an observation.
+
+**Bundle manifest:** this skill consists of `SKILL.md` plus the three
+reference files listed above. If a referenced file is missing, the install
+is incomplete: proceed using the rules in this file, tell the user which
+files are missing, and point them to the full bundle at the canonical
+source (for the published version, the repository in the attribution
+above).
+
+## Session Start Protocol
+
+1. If `skill-observations/log.md` or `cross-cutting-principles.md` don't
+   exist, create them (templates below / in the principles section of
+   `references/skill-authoring.md`). Also create
+   `skill-observations/last-review-date.txt` containing the literal value
+   `never` if it doesn't exist �?" never write a date into it at setup; a
+   date means a review actually ran. Before creating or writing anything:
+   if the resolved workspace folder sits under an ephemeral path (e.g.
+   `.Codex/worktrees/`, a temporary clone), warn the user and re-anchor
+   on the stable project path first �?" state written to an ephemeral
+   checkout is lost at teardown.
+2. Scan OPEN observations and active principles; hold them in awareness,
+   don't surface unprompted.
+3. Read `skill-observations/last-review-date.txt`. The value carries the
+   truth: a date = when the last review actually ran; `never` = no review
+   has run yet. A missing file is abnormal (step 1 creates it) �?" recreate
+   it with `never`, don't invent a date. If the value is `never` or older
+   than 7 days AND there are OPEN observations: in an interactive session,
+   offer the review in one line ("the observation backlog hasn't been
+   reviewed [in N days / yet] �?" run it now, or carry on with your task?")
+   and proceed with the user's task unless they opt in; never gate their
+   work on the review. Only a scheduled/autonomous run loads
+   `references/weekly-review.md` and runs the review unprompted.
+4. Once per session: if no AGENTS.md (or equivalent) activation instruction
+   for this skill exists, briefly suggest adding one (see
+   `references/environments.md`). Skip if already configured.
+5. Note the log's modification time. If modified in the last few hours,
+   another session may be writing to it �?" re-read immediately before every
+   append, never trust a remembered "current number".
+
+## When to Observe
+
+Active for the entire task session: execution, post-task feedback and
+review discussion, meta-discussion about skills or methodology, and
+reflective/strategy conversations about how work should be done. **The
+observation mindset does not deactivate when the conversation shifts from
+doing the work to discussing it** �?" user feedback in review phases is often
+the highest-signal input. Inactive only for casual conversation and quick
+factual questions with no tools or deliverables involved.
+
+## What to Watch For
+
+**Signals for a NEW skill:** a reusable multi-step workflow; a methodology
+the user explains that no existing skill captures; a recurring task type
+with similar structure; a process with clear inputs, phases, outputs; the
+user describing a refined process ("I always do it this way"); a structured
+approach emerging naturally during work.
+
+**Signals for IMPROVING an existing skill:** anything from a task that used
+a skill and could make it better �?" problems, positive signals, or neutral
+gaps. Examples: the agent violates a documented rule (the skill needs
+enforcement, not louder rules); a user correction reveals a missing rule or
+edge case; a better workflow emerges than the skill recommends; a technique
+works well enough to promote from incidental to recommended; an undocumented
+use case; feedback that generalises; a wrong assumption; new tooling
+obsoletes a step; corrections forming a pattern; a principle that applies to
+other skills too; a naming/framing/structural suggestion, even
+conversational.
+
+**Signals for SIMPLIFYING a skill:** a section never relevant across many
+sessions; a rule from a single unvalidated observation; workflows users
+consistently shortcut; sections loaded but never acted on; contradictory
+rules; "just in case" complexity that never triggered; a rule the agent
+consistently fails to follow (convert to structural enforcement �?" checklist,
+verification step, unskippable tool call �?" or remove it). Treat these as a
+review checklist; ask "what can we remove?" as deliberately as "what should
+we add?"
+
+**Do NOT log:** one-off corrections that don't generalise; preferences
+already captured in a skill; tool bugs unrelated to methodology;
+observations that would need proprietary client information to be useful in
+an open-source skill (unless an internal skill is the right home).
+
+## How to Log
+
+Append to the log **silently, within the same turn or the next** �?" never
+batch mentally for later; the act of writing is the enforcement mechanism.
+
+**Mandatory observation checkpoint after every 3rd TodoWrite completion:** After
+marking the 3rd, 6th, 9th (etc.) TodoWrite item as completed in a session, you
+must **write to the log** �?" not merely pause to ask yourself a question. Either
+append any pending observations, or, if genuinely none have accumulated, append
+an explicit acknowledgement marker (a one-line `no observations` note for that
+checkpoint). The required action is a concrete log write; a remembered "ask
+whether" is not enforcement. This is a hard checkpoint, not a suggestion �?" the
+skill has demonstrated that softer "check when completing items" or "pause and
+ask" guidance gets lost during cognitively demanding analytical work, exactly
+when the most observations accumulate. The count doesn't need to be precise;
+the rule is: roughly every third completion, write to the log (observations or
+the acknowledgement marker). The write itself is the enforcement mechanism: it
+forces the mental check to surface as a recorded action, and it prevents the
+common failure mode where the skill is loaded but no observations are written
+until the user explicitly asks.
+
+**Deliverable-event flush:** Hard enforcement that hooks onto tool calls you are
+already making is the only reliable mechanism; soft prompts that rely on memory
+don't survive cognitive load during long substantive sessions (when the most
+insights surface). So tie observation-flushing to deliverable and workflow events
+that already involve a tool call. Whenever you present or render a major
+deliverable �?" `present_files`, a deck or PDF render, a staged skill file handed
+to the user �?" or complete a task/todo batch, flush any pending observations to
+the log at that moment, before moving on. These are natural, already-occurring
+checkpoints; piggy-backing the flush onto them means the write happens as a
+side effect of work you were doing anyway, rather than depending on a separate
+act of memory.
+
+**Numbering discipline (mandatory, every append):**
+
+1. *Pre-check:* read the actual log and find the highest existing number �?"
+   never trust session memory:
+
+   ```bash
+   # GNU grep:
+   grep -oP '### Observation \K\d+' log.md | sort -n | tail -1
+   # macOS / POSIX:
+   grep -o '### Observation [0-9]*' log.md | grep -o '[0-9]*' | sort -n | tail -1
+   ```
+
+2. *Pre-write assertion:* immediately before appending, confirm the proposed
+   number doesn't already exist:
+
+   ```bash
+   PROPOSED=$(( $(grep -oP '### Observation \K\d+' log.md | sort -n | tail -1) + 1 ))
+   grep -qE "^### Observation ${PROPOSED}:" log.md && {
+     echo "COLLISION on #${PROPOSED}"; exit 1; }
+   ```
+
+   If it fires, increment past all existing numbers and re-check (and log a
+   meta-observation �?" it signals a parallel-session collision).
+
+3. *Post-write verification:* after appending, count occurrences of the
+   number; if >1, a parallel writer collided between check and write �?"
+   renumber YOUR entry to max+1. Identify your entry from your own append
+   operation (capture the file's line count immediately before and after
+   your `>>`; your entry starts at the old line count + 1) �?" do NOT
+   re-grep and take the last occurrence, which may be a colliding writer's
+   entry appended after yours. After any `sed` renumber, re-read the
+   affected line to confirm the substitution actually took effect �?" a
+   line-addressed `s///` whose target shifted finds no match and still
+   exits 0. Pre-write catches stale reads; only a post-write check catches
+   the race. The pattern for shared logs written by parallel agents is
+   check-then-act-then-verify.
+
+**Log-write safety �?" never let a mutation span entry boundaries:** When
+mutating the log programmatically (marking entries ACTIONED/DECLINED,
+archiving, renumbering), a greedy or DOTALL pattern over the whole file can
+silently swallow everything from one match to EOF. This has happened: a
+`.*$` under `re.S` over the multi-entry file captured from one entry's
+Status line to end-of-file and overwrote 16 later entries in a single
+substitution. The log is shared state across many entries; mutate it one
+bounded entry at a time and verify every mutation.
+
+1. **Re-read and merge immediately before any write-back.** Any full-file
+   rewrite (archival, renumbering, reassembly from chunks) built from a
+   snapshot destroys whatever concurrent sessions appended after that
+   snapshot �?" the write-back succeeds, the victim gets no error, and the
+   loss is invisible. This has happened in production: a parallel session's
+   write-back erased two entries appended minutes earlier, hours after the
+   exact failure mode had been documented. So: take the snapshot, prepare
+   the mutation, then �?" immediately before writing �?" re-read the live log
+   and diff against the snapshot. If new entries appeared, merge them into
+   the write-back (or rebuild from the fresh read). Never write back a
+   stale snapshot.
+
+2. **Isolate the target entry, or anchor to a single line.** Either split
+   the log on `### Observation N:` headers, edit the TARGET entry's chunk in
+   isolation, and reassemble �?" OR, for a status-only edit, use a strictly
+   line-anchored multiline substitution that cannot cross a newline, e.g.
+   `re.sub(r'(?m)^(\s*-?\s*)\*\*Status:\*\*.*$', ...)` (multiline `^...$`
+   bounds the match to one line). NEVER use a DOTALL/greedy pattern across
+   the multi-entry file.
+
+3. **Assert a structural invariant against the LIVE pre-write file.** Count
+   `### Observation` headers in the live file immediately before writing and
+   again after. For a status-only edit the count MUST be unchanged; for
+   archival or append it must change by exactly the expected number. The
+   baseline must be the live file at write time, NOT your session's earlier
+   snapshot �?" an invariant computed against a stale snapshot validates that
+   you wrote what you intended while still destroying what others wrote in
+   between. Fail loudly if the count is off.
+
+4. **Keep the pre-write backup.** Copy `log.md` before any programmatic
+   mutation. This is what made full recovery trivial when the truncation
+   above occurred �?" it turned a destructive bug into a non-event.
+
+5. **Verify your entries SURVIVED, not just that they were written.** A
+   successful append proves nothing an hour later �?" a concurrent session's
+   write-back can silently delete it, and only the destroying session gets
+   any signal (none). Before surfacing observations at session end, grep
+   the log for every entry number this session wrote and confirm each still
+   exists exactly once; re-append any that are missing (with fresh numbers)
+   and log a meta-observation about the collision.
+
+Principle: a log shared across many entries must be mutated one bounded
+entry at a time; every rewrite must be based on a fresh read, verified by a
+structural invariant against the live pre-write file, and backed up. Writers
+must verify survival, not just successful writes �?" in a concurrent erase,
+the victim gets no error.
+
+**Format and insertion:** always `### Observation NNN:`, always appended to
+the END of the log, never mid-file, never alternative ID formats. One
+format, one insertion point. **Every new observation MUST include
+`**Status:** OPEN` as its first field �?" this is mandatory at write time, not
+optional.** Reviews classify entries by their Status line; an observation
+written without one is invisible to any status-filtered pass and risks being
+silently skipped instead of triaged.
+
+```markdown
+### Observation [N]: [Short descriptive title]
+
+**Status:** OPEN
+**Date:** [date]
+**Session context:** [what task was being worked on]
+**Skill:** [existing skill name, or "New skill candidate: [working name]"]
+**Type:** [open-source | internal]
+**Phase/Area:** [which part of the skill or workflow]
+
+**Issue:** [What happened �?" specific enough to understand weeks later
+without the original conversation.]
+
+**Suggested improvement:** [Concrete change. For existing skills, name the
+section or rule; for new skills, scope and key components.]
+
+**Principle:** [The generalisable takeaway �?" the most important field.]
+```
+
+**Context preservation:** if an observation depends on session-local data
+(uploads, API output), save that context into the workspace first and add a
+`**Reference file:**` line �?" an observation whose evidence dies with the
+session is incomplete.
+
+**Confidentiality at logging time:** for `type: open-source` observations,
+the Issue/Improvement fields may reference specifics for context, but the
+Principle must be fully generalised �?" no client names, domains, or details
+traceable to a real project. Full confidentiality layers for skill
+authoring: `references/skill-authoring.md`.
+
+## Referencing Observations
+
+When citing an observation by number �?" in conversation, in a review report,
+or from within another observation �?" the number must come from the entry's
+literal `### Observation N:` header line. Never cite an observation number
+that wasn't read from that header.
+
+- **Search-tool line numbers are positional metadata, not IDs.** `grep -n`
+  prefixes every match with a line number; when a match lands mid-entry
+  (e.g., on a Session context or Principle line rather than the header),
+  that line number is NOT the observation number. Resolve to the owning
+  header first �?" scan backwards from the matched line to the nearest
+  preceding `### Observation N:` header and take the number from there
+  (e.g., an awk backwards-scan, or re-grep for `^### Observation` and pick
+  the last header line before the match).
+- **Plausibility check (cheap second layer):** before quoting any
+  observation number, compare it against the known counter range �?" the
+  highest `### Observation N:` header in the log. A number outside that
+  range (e.g., citing #1365 when the log's counter is at #766) is almost
+  certainly a line number or other positional artefact misread as an ID.
+
+The general rule: IDs must come from the record's own identifier field,
+never from the positional metadata of the search tool that found it.
+
+## Taxonomy (quick version)
+
+**Open-source** �?" client-agnostic, methodology-driven, useful to other
+practitioners. **Internal** �?" contains user/client/project specifics or
+personal preferences. Default to open-source when it could go either way,
+stripping specifics. The boundary is also a confidentiality boundary. Full
+requirements (attribution, licensing, structure): `references/skill-authoring.md`.
+
+## Archival on Write
+
+On every log write, first move already-resolved entries to
+`skill-observations/archive/log-[YYYY-MM-DD].md` (preserving the log header
+in the archive). "Already resolved" is decided by date, read from the file:
+a resolved status MUST record its date �?" `ACTIONED (YYYY-MM-DD) �?" [what was
+done]` / `DECLINED (YYYY-MM-DD) �?" [reason]` �?" and archival moves only
+entries whose recorded date is before today. Entries resolved today stay in
+the active log until the next day, no matter which session resolved them:
+the grace period lives in the file, never in session memory, so it holds
+across parallel and subsequent sessions. A resolved entry with no readable
+date gets today's date added instead of being archived. The active log
+keeps its header, status key, all OPEN entries, and the same-day-resolved
+ones.
+
+Archival is a read-filter-rewrite �?" the highest-risk mutation the log
+undergoes, and the one that has destroyed concurrent appends in production.
+It MUST follow the full Log-write safety sequence above: backup, re-read
+the live log immediately before writing back and merge any entries that
+appeared since the snapshot, then verify the post-write header count equals
+the live pre-write count minus exactly the number of archived entries.
+
+## Log Structure
+
+```markdown
+# Skill Observation Log
+
+Observations captured during task-oriented work.
+
+**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill
+updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue �?"
+resolved statuses always carry their resolution date
+
+---
+
+## [Date]
+
+### Observation 1: [Title]
+**Status:** OPEN
+[... full format ...]
+```
+
+## Surfacing Protocol
+
+Default: at end of session, as a grouped summary �?" improvements grouped by
+skill, new-skill candidates listed separately; for each, one sentence plus
+suggested type; ask which to act on. Surface earlier when an observation
+needs user input to be complete, when a skill is actively producing wrong
+output, or when observations cluster on one skill.
+
+**Default to log-and-defer.** Surfacing an observation is not an invitation
+to act on it. The default is log-and-defer: state that the observation is
+logged for the next review, and stop. Reserve in-session application
+strictly for the two triggers already defined under "Acting on
+Observations" �?" an explicit user request that names the action, or
+correcting a skill that is producing wrong output in the current session.
+
+Do NOT routinely offer a binary "apply now vs leave for next review" choice
+when surfacing observations. For users who run regular reviews, that offer is
+unwanted friction repeated every session. If a user has expressed a standing
+preference to always defer to the next review, suppress the in-session
+"act now?" offer entirely rather than asking each time.
+
+**Self-check before surfacing:** observations were logged throughout the
+whole session (including discussion phases); logged silently; each follows
+Issue �+' Improvement �+' Principle; each is typed; existing-skill items name
+the section; no open-source Principle contains client-identifying info;
+every appended observation carries a Status line (`**Status:** OPEN` at
+write time) �?" a statusless entry is invisible to any status-filtered review
+pass, so if any observation lacks one, add it now. Finally, run the
+survival check (Log-write safety rule 5): grep the log for every entry
+number this session wrote and confirm each still exists exactly once �?" a
+concurrent session's write-back deletes silently. Fix failures before
+surfacing.
+
+## Acting on Observations
+
+Act only in three contexts: (1) the comprehensive review (load
+`references/weekly-review.md`); (2) an explicit user request ("update X
+skill", "act on observation #N"); (3) in-session correction when a skill is
+producing wrong output the user should know about. Otherwise: log, don't
+act.
+
+When acting: small, clearly-additive, low-risk changes (a new rule, a
+clarification, a factual fix) may be applied directly. Substantial changes
+(restructuring, new capabilities, changed methodology) and all new-skill
+creation: load `references/skill-authoring.md` first and follow its editing
+and staging rules. If an observation reveals a principle that applies to
+skills generally, propose it for the cross-cutting principles file (see the
+same reference).
+
+## Quick Reference
+
+| Question | Answer |
+|----------|--------|
+| When do I observe? | The whole session, including feedback and reflection phases |
+| How do I log? | Silently, immediately, appended to the end, with the 3-step numbering discipline |
+| When do I surface? | End of session, or earlier if needed |
+| Status line? | Mandatory `**Status:** OPEN` as the first field of every new observation; reviews treat statusless entries as OPEN, never as nonexistent |
+| Citing an observation number? | Only from its literal `### Observation N:` header �?" `grep -n` line numbers are positional metadata, not IDs; sanity-check against the known counter range |
+| Open-source or internal? | Default open-source; the boundary is confidential |
+| Small fix or substantial? | Additive �+' apply directly; restructuring/new skill �+' `references/skill-authoring.md` |
+| Rewriting the log (archival/renumber/status)? | Backup �+' re-read live and merge �+' bounded mutation �+' verify count against live pre-write file �+' confirm own entries survived |
+| Weekly review? | Trigger check at session start; procedure in `references/weekly-review.md` |
+| No filesystem? | Handoff-doc mode �?" `references/environments.md` |
+
+hook: PostToolUse
+ succeeded in 1056ms:
+---
+name: verification-before-completion
+description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
+---
+
+# Verification Before Completion
+
+## Overview
+
+**Core principle:** Evidence before claims, always.
+
+**Violating the letter of this rule is violating the spirit of this rule.**
+
+## The Iron Law
+
+```
+NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
+```
+
+If you haven't run the verification command in this message, you cannot claim it passes.
+
+## The Gate Function
+
+```
+BEFORE claiming any status or expressing satisfaction:
+
+1. IDENTIFY: What command proves this claim?
+2. RUN: Execute the FULL command (fresh, complete)
+3. READ: Full output, check exit code, count failures
+4. VERIFY: Does output confirm the claim?
+   - If NO: State actual status with evidence
+   - If YES: State claim WITH evidence
+5. ONLY THEN: Make the claim
+
+Skip any step = lying, not verifying
+```
+
+## Common Failures
+
+| Claim | Requires | Not Sufficient |
+|-------|----------|----------------|
+| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
+| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
+| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
+| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
+| Regression test works | Red-green cycle verified | Test passes once |
+| Agent completed | VCS diff shows changes | Agent reports "success" |
+| Requirements met | Line-by-line checklist | Tests passing |
+
+## Red Flags - STOP
+
+- Using "should", "probably", "seems to"
+- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!", etc.)
+- About to commit/push/PR without verification
+- Trusting agent success reports
+- Relying on partial verification
+- Thinking "just this once"
+- Tired and wanting work over
+- **ANY wording implying success without having run verification**
+
+## Rationalization Prevention
+
+| Excuse | Reality |
+|--------|---------|
+| "Should work now" | RUN the verification |
+| "I'm confident" | Confidence �%� evidence |
+| "Just this once" | No exceptions |
+| "Linter passed" | Linter �%� compiler |
+| "Agent said success" | Verify independently |
+| "I'm tired" | Exhaustion �%� excuse |
+| "Partial check is enough" | Partial proves nothing |
+| "Different words so rule doesn't apply" | Spirit over letter |
+
+## Key Patterns
+
+**Tests:**
+```
+�o. [Run test command] [See: 34/34 pass] "All tests pass"
+�?O "Should pass now" / "Looks correct"
+```
+
+**Regression tests (TDD Red-Green):**
+```
+�o. Write �+' Run (pass) �+' Revert fix �+' Run (MUST FAIL) �+' Restore �+' Run (pass)
+�?O "I've written a regression test" (without red-green verification)
+```
+
+**Build:**
+```
+�o. [Run build] [See: exit 0] "Build passes"
+�?O "Linter passed" (linter doesn't check compilation)
+```
+
+**Requirements:**
+```
+�o. Re-read plan �+' Create checklist �+' Verify each �+' Report gaps or completion
+�?O "Tests pass, phase complete"
+```
+
+**Agent delegation:**
+```
+�o. Agent reports success �+' Check VCS diff �+' Verify changes �+' Report actual state
+�?O Trust agent report
+```
+
+## When To Apply
+
+**ALWAYS before:**
+- ANY variation of success/completion claims
+- ANY expression of satisfaction
+- ANY positive statement about work state
+- Committing, PR creation, task completion
+- Moving to next task
+- Delegating to agents
+
+**Rule applies to:**
+- Exact phrases
+- Paraphrases and synonyms
+- Implications of success
+- ANY communication suggesting completion/correctness
+
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/gate-check.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/gate-selftest.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'docs/evidence/2026-10-26-f3-data-real-guard.md' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/data-real-guard.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/data-real-guard-selftest.js' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i = 0; Get-Content -LiteralPath '"'fit-finder/tools/README.md' | ForEach-Object { "'$i++; '"'{0,4}: {1}' -f "'$i, $_ }' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 731ms:
+   1: /* node tools/gate-check.js <EV> --stage before|final [--no-git]
+   2:    Checks the gate evidence doc: summaries derived from the score lines, the keep rule, the REASON text, prediction order, git state. */
+   3: const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
+   4: const a = process.argv.slice(2);
+   5: const stage = a.indexOf('--stage') >= 0 ? a[a.indexOf('--stage') + 1] : '';
+   6: const noGit = a.includes('--no-git');
+   7: const file = a.find((x, i) => !x.startsWith('--') && a[i - 1] !== '--stage');
+   8: if (!file || !['before', 'final'].includes(stage)) { console.log('usage: gate-check.js <EV> --stage before|final [--no-git]'); process.exit(2); }
+   9: const root = path.join(__dirname, '..');
+  10: const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
+  11: const get = (tag) => {
+  12:   const i = lines.findIndex((l) => l.startsWith(tag));
+  13:   return i < 0 ? null : { i, v: lines[i].slice(tag.length).trim() };
+  14: };
+  15: const bad = [];
+  16: // always, even with --no-git: real data must never be tracked (studio-harness F3)
+  17: const real = require('./data-real-guard.js').trackedReal(root);
+  18: if (!real.ok) bad.push(real.error);
+  19: else if (real.files.length) bad.push('data/real is tracked by git: ' + real.files.join(', '));
+  20: function parse(text) {
+  21:   const m = (re) => { const x = re.exec(text); return x ? +x[1] : NaN; };
+  22:   const s = /split: right feature first (\d+) of (\d+)/.exec(text);
+  23:   const r = { R: s ? +s[1] : NaN, F: s ? +s[2] : NaN, W: m(/wrong card (\d+)/), N: m(/no card where one fits (\d+)/), K: m(/card on a not-a-fit prompt (\d+)/) };
+  24:   return Object.values(r).some(Number.isNaN) ? null : r;
+  25: }
+  26: const derived = (x) => `feature ${x.R} of ${x.F}, wrong ${x.W}, no card ${x.N}, not-a-fit ${x.K}`;
+  27: function side(lineTag, sumTag) {
+  28:   const L = get(lineTag), S = get(sumTag);
+  29:   if (!L) { bad.push('missing ' + lineTag); return null; }
+  30:   const p = parse(L.v);
+  31:   if (!p) { bad.push(lineTag + ' lacks the score numbers'); return null; }
+  32:   if (!S) bad.push('missing ' + sumTag);
+  33:   else if (S.v !== derived(p)) bad.push(`${sumTag} should be "${derived(p)}"`);
+  34:   return { p, L };
+  35: }
+  36: const base = get('BASE-SHA:');
+  37: if (!base || !base.v) bad.push('missing BASE-SHA:');
+  38: const b = side('BEFORE-LINE:', 'BEFORE:');
+  39: const pm = get('PREDICTION-PM:'), lead = get('PREDICTION-LEAD:');
+  40: if (!pm) bad.push('missing PREDICTION-PM:');
+  41: if (!lead) bad.push('missing PREDICTION-LEAD:');
+  42: const outcome = get('OUTCOME:'), reason = get('REASON:');
+  43: let a1 = null;
+  44: const finalOutcome = outcome ? outcome.v : 'pending';
+  45: if (b) {
+  46:   const N0 = b.p.N, inconclusive = N0 < 6;
+  47:   if (inconclusive) {
+  48:     if (!outcome || outcome.v !== 'inconclusive') bad.push('before no-card < 6: OUTCOME must be inconclusive');
+  49:     if (!reason || reason.v !== `before no-card < 6 (${N0})`) bad.push(`REASON must be "before no-card < 6 (${N0})"`);
+  50:   }
+  51:   if (stage === 'final') {
+  52:     if (inconclusive) {
+  53:       if (get('AFTER-LINE:') || get('AFTER:')) bad.push('inconclusive run must have no AFTER-LINE or AFTER:');
+  54:     } else {
+  55:       a1 = side('AFTER-LINE:', 'AFTER:');
+  56:       if (!outcome || !['kept', 'reverted'].includes(outcome.v)) bad.push('OUTCOME must be kept or reverted');
+  57:       const al = get('AFTER-LINE:');
+  58:       if (al && pm && lead && (pm.i > al.i || lead.i > al.i)) bad.push('PREDICTION lines must come before AFTER-LINE');
+  59:       if (a1) {
+  60:         const x = b.p, y = a1.p, why = [];
+  61:         if (!(x.N - y.N >= 2)) why.push(`no-card fall < 2 (${x.N} to ${y.N})`);
+  62:         if (!(y.W <= x.W)) why.push(`wrong card rose (${x.W} to ${y.W})`);
+  63:         if (!(y.K <= x.K)) why.push(`not-a-fit card rose (${x.K} to ${y.K})`);
+  64:         const kept = why.length === 0, want = kept ? 'none' : why.join(' and ');
+  65:         if (outcome && outcome.v !== (kept ? 'kept' : 'reverted')) bad.push(`OUTCOME should be ${kept ? 'kept' : 'reverted'}`);
+  66:         if (!reason || reason.v !== want) bad.push(`REASON should be "${want}"`);
+  67:         const pr = get('PREDICTION:');
+  68:         if (!pr || pr.v !== (kept ? 'held' : 'did not hold')) bad.push(`PREDICTION: should be "${kept ? 'held' : 'did not hold'}"`);
+  69:       }
+  70:     }
+  71:   }
+  72: }
+  73: if (!noGit && base && base.v && !bad.length) {
+  74:   const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8' }).status;
+  75:   const sha = base.v, mf = path.join(root, 'tests/match-frozen.js');
+  76:   const same = run('git', ['diff', '--quiet', sha, 'HEAD', '--', ':(top)fit-finder/engine/fit.js']) === 0;
+  77:   if (finalOutcome === 'kept') {
+  78:     if (same) bad.push('kept but engine/fit.js equals BASE');
+  79:     if (run('node', [mf, '--base', sha, '--allow', 'engine']) !== 0) bad.push('match-frozen --allow engine fails');
+  80:     if (run('node', [mf, '--base', sha]) === 0) bad.push('match-frozen passes without --allow engine');
+  81:   } else {
+  82:     if (!same) bad.push('engine/fit.js differs from BASE but outcome is ' + finalOutcome);
+  83:     if (run('node', [mf, '--base', sha]) !== 0) bad.push('match-frozen --base fails');
+  84:   }
+  85: }
+  86: if (bad.length) { console.log('gate-check FAIL: ' + bad.join('; ')); process.exit(1); }
+  87: const f = (t, x) => `${t} feature ${x.R} of ${x.F} wrong ${x.W} no-card ${x.N} not-a-fit ${x.K}`;
+  88: console.log(`gate-check ok ${stage} ${finalOutcome}; ${f('before', b.p)}` + (a1 ? `; ${f('after', a1.p)}` : ''));
+
+hook: PostToolUse
+ succeeded in 722ms:
+   1: /* node tools/gate-selftest.js : exercises gate-check.js (--no-git, plus one git-mode engine-diff case) and engine-scope.js. Prints gate-selftest ok or the first failure. */
+   2: const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
+   3: const root = path.join(__dirname, '..');
+   4: const gc = path.join(__dirname, 'gate-check.js');
+   5: const es = require('./engine-scope.js');
+   6: const fail = (m) => { console.log('gate-selftest FAIL: ' + m); process.exit(1); };
+   7: const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-selftest-'));
+   8: let n = 0;
+   9: 
+  10: // a score line; `cr` is the "first card right" number (differs from the split number on purpose)
+  11: const line = (R, F, W, N, K, cr) => `first card right: ${cr === undefined ? R + 3 : cr} of ${F + 4} that fit; wrong card ${W} (a); no card where one fits ${N} (b); card on a not-a-fit prompt ${K} (c); fit agreement 12 of 29; score 5; split: right feature first ${R} of ${F}, rightly none 3 (x)`;
+  12: const sum = (tag, R, F, W, N, K) => `${tag} feature ${R} of ${F}, wrong ${W}, no card ${N}, not-a-fit ${K}`;
+  13: function doc(o) {
+  14:   const b = o.b || [17, 29, 2, 8, 0], a = o.a;
+  15:   const L = ['BASE-SHA: ' + (o.sha || 'ae60341'), 'BEFORE-LINE: ' + line(...b), o.beforeSum || sum('BEFORE:', ...b)];
+  16:   if (!o.noPred) { if (!o.pmLate) L.push('PREDICTION-PM: x'); L.push('PREDICTION-LEAD: y'); }
+  17:   if (o.outcome && !a) L.push('OUTCOME: ' + o.outcome);
+  18:   if (o.reason) L.push('REASON: ' + o.reason);
+  19:   if (a) {
+  20:     L.push('AFTER-LINE: ' + line(...a), o.afterSum || sum('AFTER:', ...a));
+  21:     if (o.pmLate) L.push('PREDICTION-PM: x');
+  22:     L.push('OUTCOME: ' + o.outcome, 'REASON: ' + o.reason);
+  23:     if (o.pred) L.push('PREDICTION: ' + o.pred);
+  24:   }
+  25:   return L.join('\n') + '\n';
+  26: }
+  27: function run(stage, o, git) {
+  28:   const f = path.join(dir, 'ev' + (n++) + '.md');
+  29:   fs.writeFileSync(f, doc(o));
+  30:   const r = spawnSync('node', [gc, f, '--stage', stage].concat(git ? [] : ['--no-git']), { encoding: 'utf8' });
+  31:   return git ? r : r.status === 0;
+  32: }
+  33: const ok = (name, stage, o) => { if (!run(stage, o)) fail(name + ' should pass'); };
+  34: const bad = (name, stage, o) => { if (run(stage, o)) fail(name + ' should fail'); };
+  35: 
+  36: ok('before', 'before', {});
+  37: bad('before N0=5 no outcome', 'before', { b: [17, 29, 2, 5, 0] });
+  38: ok('before N0=5 inconclusive', 'before', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
+  39: bad('before N0=5 wrong reason', 'before', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'none' });
+  40: ok('final N0=5 inconclusive', 'final', { b: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
+  41: bad('final N0=5 with after', 'final', { b: [17, 29, 2, 5, 0], a: [17, 29, 2, 5, 0], outcome: 'inconclusive', reason: 'before no-card < 6 (5)' });
+  42: 
+  43: const B = [17, 29, 2, 8, 0];
+  44: ok('kept', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'held' });
+  45: bad('kept pred did not hold', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'did not hold' });
+  46: ok('reverted N', 'final', { b: B, a: [20, 29, 2, 7, 0], outcome: 'reverted', reason: 'no-card fall < 2 (8 to 7)', pred: 'did not hold' });
+  47: bad('kept when N fell 1', 'final', { b: B, a: [20, 29, 2, 7, 0], outcome: 'kept', reason: 'none', pred: 'held' });
+  48: ok('reverted W', 'final', { b: B, a: [20, 29, 3, 5, 0], outcome: 'reverted', reason: 'wrong card rose (2 to 3)', pred: 'did not hold' });
+  49: ok('reverted K', 'final', { b: B, a: [20, 29, 2, 5, 1], outcome: 'reverted', reason: 'not-a-fit card rose (0 to 1)', pred: 'did not hold' });
+  50: const all = [20, 29, 3, 8, 1], r1 = 'no-card fall < 2 (8 to 8)', r2 = 'wrong card rose (2 to 3)', r3 = 'not-a-fit card rose (0 to 1)';
+  51: ok('all three', 'final', { b: B, a: all, outcome: 'reverted', reason: [r1, r2, r3].join(' and '), pred: 'did not hold' });
+  52: bad('middle missing', 'final', { b: B, a: all, outcome: 'reverted', reason: [r1, r3].join(' and '), pred: 'did not hold' });
+  53: bad('first two swapped', 'final', { b: B, a: all, outcome: 'reverted', reason: [r2, r1, r3].join(' and '), pred: 'did not hold' });
+  54: bad('PM after AFTER-LINE', 'final', { b: B, a: [20, 29, 2, 6, 0], outcome: 'kept', reason: 'none', pred: 'held', pmLate: true });
+  55: bad('summary disagrees', 'final', { b: B, a: [20, 29, 2, 6, 0], afterSum: sum('AFTER:', 21, 29, 2, 6, 0), outcome: 'kept', reason: 'none', pred: 'held' });
+  56: bad('summary from first card right', 'final', { b: B, a: [20, 29, 2, 6, 0, 24], afterSum: sum('AFTER:', 24, 33, 2, 6, 0), outcome: 'kept', reason: 'none', pred: 'held' });
+  57: ok('summary from split with differing first-card number', 'final', { b: B, a: [20, 29, 2, 6, 0, 24], outcome: 'kept', reason: 'none', pred: 'held' });
+  58: 
+  59: // git mode: engine/fit.js at BASE must be compared with HEAD (was a doubled path, always 'same')
+  60: const gr = run('before', { sha: '23757a5' }, true);
+  61: if (!/engine\/fit\.js differs from BASE/.test(gr.stdout)) fail('git mode: BASE with a different engine/fit.js should report that it differs; got: ' + gr.stdout.trim());
+  62: 
+  63: // engine-scope
+  64: const base = fs.readFileSync(path.join(root, 'engine/fit.js'), 'utf8').replace(/\r\n/g, '\n');
+  65: const crlf = (s) => s.replace(/\n/g, '\r\n');
+  66: const once = (s, a, b) => { const i = s.indexOf(a); if (i < 0) fail('anchor missing: ' + a); return s.slice(0, i) + b + s.slice(i + a.length); };
+  67: const opsAt = base.indexOf('    READ: /') + 11;
+  68: const gateAt = base.indexOf('    let fit;\n') + 14;
+  69: const inOps = base.slice(0, opsAt) + '  ' + base.slice(opsAt);              // a changed char inside OPS
+  70: const inGate = base.slice(0, gateAt) + ' ' + base.slice(gateAt);              // a changed char inside the gate block
+  71: const step = /STEP/.test(base) ? once(base, 'STEP', 'STEq') : fail('no STEP label in engine');
+  72: const expect = (name, got, empty) => { if (!!got.length === empty) fail('engine-scope ' + name + (empty ? ' should be empty: ' + got.join('; ') : ' should fail')); };
+  73: expect('same', es.check(base, base), true);
+  74: expect('ops change', es.check(base, inOps), true);
+  75: expect('gate change', es.check(base, inGate), true);
+  76: expect('STEP change', es.check(base, step), false);
+  77: const km = base.match(/^\s{4}([A-Z]+):/m)[1];
+  78: expect('deleted key', es.check(base, once(base, '    ' + km + ':', '    ' + km.toLowerCase() + 'x:')), false);
+  79: expect('Date in OPS', es.check(base, base.slice(0, opsAt) + '/*Date.now()*/' + base.slice(opsAt)), false);
+  80: expect('crlf vs lf', es.check(crlf(base), base), true);
+  81: const mixed = (s) => s.split('\n').map((l, i, all) => i % 2 && i < all.length - 1 ? l + '\r' : l).join('\n');
+  82: expect('lf vs mixed ops change', es.check(base, mixed(inOps)), true);
+  83: expect('mixed STEP', es.check(base, mixed(step)), false);
+  84: console.log('gate-selftest ok');
+
+hook: PostToolUse
+ succeeded in 700ms:
+   1: # F3 (Fit Finder half): the done check fails when data/real is tracked
+   2: 
+   3: studio-harness F3 (premortem 7): "the Fit Finder done check fails if data/real is git-tracked". Branch `harness/f3-data-real-guard`, based on `prompt-coach` fb26061. Run 2026-10-26 ~01:05Z on Ian's PC.
+   4: 
+   5: ## What changed
+   6: 
+   7: - `fit-finder/tools/data-real-guard.js`: runs `git ls-files -- data/real` from `fit-finder/`; exit 1 if it lists anything, and exit 1 if git itself fails (fails closed). Lists paths only, never reads the files.
+   8: - `fit-finder/tools/gate-check.js` (the Fit Finder done/gate check) calls it on every run, even with `--no-git`, and adds `data/real is tracked by git: <paths>` to its FAIL reasons.
+   9: - `fit-finder/tools/data-real-guard-selftest.js`: test, written first. A throwaway git repo shaped like workiva gets copies of the real `gate-check.js` and `data-real-guard.js` and one fake file `fit-finder/data/real/fake.jsonl`. The real `data/real` is never opened.
+  10: - `fit-finder/tools/README.md`: the gate-check row names the new failure; one row for the guard and its selftest.
+  11: 
+  12: Choice logged: Fit Finder has no GOAL.md done line, so "the done check" is taken to be `tools/gate-check.js`, the only gate check script, and the guard is also runnable alone.
+  13: 
+  14: ## Test run (commands from `fit-finder/`)
+  15: 
+  16: Red 1, guard not written: `node tools/data-real-guard-selftest.js` -> exit 1, `ENOENT ... copyfile ...tools\data-real-guard.js`.
+  17: 
+  18: Red 2, guard written but not called by gate-check (the join):
+  19: ```
+  20: data-real-guard-selftest FAIL: tracked gate: want exit 1 matching /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/, got 0: gate-check ok before pending; before feature 17 of 29 wrong 2 no-card 8 not-a-fit 0
+  21: exit 1
+  22: ```
+  23: 
+  24: Green, after the call in gate-check:
+  25: ```
+  26: ## data-real-guard-selftest
+  27: data-real-guard-selftest ok (7 checks)
+  28: exit 0
+  29: ## gate-selftest
+  30: gate-selftest ok
+  31: exit 0
+  32: ## data-real-guard on this checkout
+  33: data-real-guard ok
+  34: exit 0
+  35: ```
+  36: 
+  37: The 7 checks: untracked file on disk passes (guard, gate); `git add -f` of the fake file fails (guard and gate, each naming the path; `trackedReal` lists exactly it); `git rm --cached` passes again; outside any repo the guard fails closed (`git ls-files failed`). On this checkout nothing under `data/real` is tracked.
+
+hook: PostToolUse
+ succeeded in 701ms:
+   1: /* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
+   2:    Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed). */
+   3: const { spawnSync } = require('child_process');
+   4: function trackedReal(dir) {
+   5:   const r = spawnSync('git', ['ls-files', '--', 'data/real'], { cwd: dir, encoding: 'utf8' });
+   6:   if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
+   7:   return { ok: true, files: r.stdout.split(/\r?\n/).filter(Boolean) };
+   8: }
+   9: module.exports = { trackedReal };
+  10: if (require.main === module) {
+  11:   const t = trackedReal(process.cwd());
+  12:   if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
+  13:   if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
+  14:   console.log('data-real-guard ok');
+  15: }
+
+hook: PostToolUse
+ succeeded in 749ms:
+   1: /* node tools/data-real-guard-selftest.js : exercises data-real-guard.js and its call from gate-check.js in a throwaway git repo
+   2:    (fake files only; the real data/real is never read). Prints data-real-guard-selftest ok or the first failure. */
+   3: const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
+   4: const fail = (m) => { console.log('data-real-guard-selftest FAIL: ' + m); process.exit(1); };
+   5: const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-real-guard-'));
+   6: const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
+   7: 
+   8: // throwaway repo shaped like workiva: <repo>/fit-finder/tools/{gate-check,data-real-guard}.js copied from this checkout
+   9: const repo = path.join(tmp, 'repo'), ff = path.join(repo, 'fit-finder');
+  10: fs.mkdirSync(path.join(ff, 'tools'), { recursive: true });
+  11: fs.mkdirSync(path.join(ff, 'data', 'real'), { recursive: true });
+  12: for (const f of ['gate-check.js', 'data-real-guard.js']) fs.copyFileSync(path.join(__dirname, f), path.join(ff, 'tools', f));
+  13: if (git(repo, 'init', '-q').status !== 0) fail('git init');
+  14: fs.writeFileSync(path.join(ff, 'data', 'real', 'fake.jsonl'), '{"fake":"not real data"}\n');
+  15: fs.writeFileSync(path.join(ff, 'README.md'), 'x\n');
+  16: git(repo, 'add', 'fit-finder/README.md');
+  17: 
+  18: // a valid before-stage evidence doc (no-card 8, so no OUTCOME needed)
+  19: const line = 'first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits 8 (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)';
+  20: const ev = path.join(tmp, 'ev.md');
+  21: fs.writeFileSync(ev, ['BASE-SHA: ae60341', 'BEFORE-LINE: ' + line, 'BEFORE: feature 17 of 29, wrong 2, no card 8, not-a-fit 0', 'PREDICTION-PM: x', 'PREDICTION-LEAD: y'].join('\n') + '\n');
+  22: const gate = () => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8' });
+  23: const guard = (cwd) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp } });
+  24: let n = 0;
+  25: const expect = (name, r, code, re) => {
+  26:   n++;
+  27:   if (r.status !== code || !re.test(r.stdout)) fail(`${name}: want exit ${code} matching ${re}, got ${r.status}: ${(r.stdout + r.stderr).trim()}`);
+  28: };
+  29: 
+  30: // 1-2. control: data/real exists on disk but is untracked, so guard and done check pass
+  31: expect('untracked guard', guard(ff), 0, /^data-real-guard ok/);
+  32: expect('untracked gate', gate(), 0, /^gate-check ok before/);
+  33: 
+  34: // 3-5. tracked: git add a file under data/real, and both fail naming it
+  35: git(repo, 'add', '-f', 'fit-finder/data/real/fake.jsonl');
+  36: expect('tracked guard', guard(ff), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
+  37: expect('tracked gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
+  38: const { trackedReal } = require(path.join(ff, 'tools', 'data-real-guard.js'));
+  39: const t = trackedReal(ff);
+  40: if (!t.ok || t.files.join() !== 'data/real/fake.jsonl') fail('trackedReal lists ' + JSON.stringify(t));
+  41: n++;
+  42: 
+  43: // 6. untrack again: passes again
+  44: git(repo, 'rm', '-q', '--cached', 'fit-finder/data/real/fake.jsonl');
+  45: expect('untracked again gate', gate(), 0, /^gate-check ok before/);
+  46: 
+  47: // 7. fails closed outside a git repo (git ls-files errors)
+  48: const bare = path.join(tmp, 'not-a-repo');
+  49: fs.mkdirSync(bare);
+  50: expect('no repo guard', guard(bare), 1, /data-real-guard FAIL: git ls-files failed/);
+  51: 
+  52: fs.rmSync(tmp, { recursive: true, force: true });
+  53: console.log(`data-real-guard-selftest ok (${n} checks)`);
+
+hook: PostToolUse
+ succeeded in 940ms:
+   1: # fit-finder/tools
+   2: 
+   3: Small scripts for the BCA run. Run them from `fit-finder/` (paths are relative to where you run them). Every script exits non-zero on a problem. `node tools/selftest.js` exercises all of them on `tools/fixtures/` and prints `selftest ok`.
+   4: 
+   5: `L` below is the run ledger `<repo root>/.ledger/2026-10-22-fit-finder-bca` (git-ignored; the env var `FF_LEDGER` overrides it, used by the self-test only).
+   6: 
+   7: | Script | Arguments | Prints | Exit |
+   8: |---|---|---|---|
+   9: | `check-set.js` | `<prompts> <gold\|-> <catalogue> [--not-range LO HI]` | `rows N, per area FR a GRC b SUS c GEN d, gold M, not K, unknown cards U` | 1 on 0 rows, a row lacking string `id`/`task`, a repeated id, an `area` not in FR/GRC/SUS/GEN. With gold: a missing or extra gold id, `fit` not good/partial/not, `cards` not an array, a `not` row with cards, a card id not in the catalogue; with `--not-range`, K outside LO..HI |
+  10: | `nearcopy.js` | `<fresh> <real dir> [--catalogue <catalogue>]` | `files read F, rows read R, windows W`, `control: hit`, then `hits: none` or `hits: <fresh ids>`. Never prints text | 1 if F, R or W is 0, the positive control misses, or any hit. 5-word windows over every string value of every real row; with `--catalogue` a fresh row also hits on a window shared with any card's `try` |
+  11: | `agree.js` | `<frozen> <final>` | `N <n> D <d> agreement <pct> PASS\|FAIL` | 1 if an id set differs, a differing row (fit or sorted cards) lacks `"by":"ian"`, an unchanged row has it, or (N-D)/N < 0.845 (N=40: D <= 6) |
+  12: | `card-view.js` | `<catalogue> <out>` | `cards N` | writes `{"useCases":[...]}` with every card minus `match` and `ops` (`try` kept) |
+  13: | `label-sheet.js` | `<draft> <card-view> <out>`; or `--verify <sheet> <draft> <catalogue>` | `label-sheet rows N`; or `label-sheet ok` | 1 on bad input; `--verify` rebuilds the sheet from the draft and catalogue and needs a byte-for-byte match |
+  14: | `label-handoff.js` | `[--check] <looks file> <sheet> <ian batch json> <catalogue> <out frozen> <out gold>` | `label-handoff ok rows N changed D`, or `STOP: <reason>` | 3 on any `STOP`. `--check` recomputes both outputs in memory and exits 1 unless they equal the files byte for byte |
+  15: | `score-once.js` | `<name> <prompts> <gold> [--scorer <path>]` | the scorer's stdout (from `L/score-<name>.out` on a repeat) | the scorer's status. 3 with `STOP: unknown outcome` if `L/score-<name>.started` exists without `.out` |
+  16: | `keep-check.js` | `<EV>` | `keep-check ok <outcome>` | 1 if the rule, the written REASON or the git state disagree |
+  17: | `ops-check.js` | `<base sha>` | `ops-check ok <n> cards changed` | 1 on any violation |
+  18: | `diag-nocard.js`, `diag-selftest.js` | `[--engine <path>]` (self-test only); selftest: none (needs `FF_LEDGER`) | `diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K`; selftest `diag-selftest ok` | 1 with `INVALID: ...` if tune wrong > 4, tune not-a-fit > BASE_K or half A wrong > 0; 2 on bad input. Reads only the tune set and half A |
+  19: | `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees, or (always, even with `--no-git`) git tracks anything under `data/real` |
+  20: | `data-real-guard.js`, `data-real-guard-selftest.js` | none | `data-real-guard ok` / `data-real-guard FAIL: data/real is tracked by git: <paths>`; `data-real-guard-selftest ok (7 checks)` | 1 if `git ls-files -- data/real` lists anything or itself fails; lists paths only, never reads the files. The selftest uses a throwaway repo with a fake file |
+  21: | `engine-scope.js`, `gate-selftest.js` | `--git <sha>` or `--files <base> <new>`; selftest: none | `engine-scope ok` / `engine-scope FAIL: <problems>`; `gate-selftest ok` | 1 if `engine/fit.js` differs from the base outside the `OPS` block and the `let fit;`..`return { fit,` gate block (line endings ignored), an OPS key changed, or an added line has Date/performance/location/http/fetch/require(/process |
+  22: | `selftest.js` | none | `selftest ok` or `selftest FAIL: ...` | 1 on the first failure |
+  23: 
+  24: ## Details
+  25: 
+  26: **label-handoff.** The PICK is ONE line of space-separated `<id>=<label>` tokens after a `PICK` marker (on the same line, or the next non-empty line). Labels: a catalogue card id, `none`, `not`. Every sheet id (`### <id> | <area>` headings) appears exactly once. The batch needs a non-empty `words`, a boolean `accepted`, `sheetSha256` equal to the sheet's sha256 (and the sheet must match `L/label-sheet.sha256` if that exists), `changes[].id` in the sheet with a legal `label`, and empty `changes` when `accepted` is true. Frozen rows: `{"id","fit","cards","by":"pm"}` (card id: `good` + `[id]`; `none`: `good` + `[]`; `not`: `not` + `[]`). Gold = frozen with the changes applied and `"by":"ian"` on exactly the changed rows (a change equal to the PM label is ignored).
+  27: 
+  28: **score-once.** Runs `node tests/synth-score.js <prompts> <gold>` from `fit-finder/` (or `--scorer`, self-test only) at most once per `<name>`. First call: writes `.started`, runs, writes `.out` atomically (first line `STATUS <n>`, then stdout), prints stdout, exits with the scorer's status. Later calls print the saved stdout and exit with the saved status without running anything. Fresh/holdout/blind lines are copied only from `L/score-<name>.out`.
+  29: 
+  30: **keep-check.** Reads `BEFORE-LINE`, `AFTER-LINE`, `OUTCOME`, `REASON` from the evidence doc; R = number after `right feature first `, S = number after `score `. Kept iff R1 >= R0 + 1 and S1 <= S0. REASON must be `none` (kept) or `R gain < 1 (R0 to R1)` / `S rose (S0 to S1)` / `R gain < 1 and S rose (R0 to R1; S0 to S1)`. Git check against the commit whose subject starts `task 11:`: reverted needs `node tests/match-frozen.js --base <sha>` to pass; kept needs it to pass with `--allow ops` and fail without.
+  31: 
+  32: **ops-check.** Compares `data/catalogue.json` at `<base sha>` with the working tree: same cards in the same order, every field except `ops` equal, each `ops` starts with the old `ops` (append only), every added value is in `AI_OPS` (`engine/fit.js`, the list `tests/catalogue.test.js` checks), and at least one card changed.
+
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+codex
+About 11 minutes left. The guard runs before the stage, outcome, and `--no-git` branches, and a guard failure stays in the final failure list. The new selftest exercises the actual gate script in a fake repo. I’ll now check whether Git can select the wrong index or miss tracked paths.
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -LiteralPath "C:/Users/teasp/.codex/plugins/cache/superpowers-marketplace/superpowers/7.0.1/skills/using-superpowers/references/codex-tools.md"' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'node fit-finder/tools/data-real-guard-selftest.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git log -1 --format=fuller d007e0b' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ exited 1 in 478ms:
+node:fs:3600
+  return binding.mkdtemp(prefix, options.encoding);
+                 ^
+
+Error: EPERM: operation not permitted, mkdtemp 'C:\Users\teasp\AppData\Local\Temp\data-real-guard-XXXXXX'
+    at Object.mkdtempSync (node:fs:3600:18)
+    at Object.<anonymous> (C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard\fit-finder\tools\data-real-guard-selftest.js:5:16)
+    at Module._compile (node:internal/modules/cjs/loader:1934:14)
+    at Object..js (node:internal/modules/cjs/loader:2074:10)
+    at Module.load (node:internal/modules/cjs/loader:1656:32)
+    at Module._load (node:internal/modules/cjs/loader:1448:12)
+    at wrapModuleLoad (node:internal/modules/cjs/loader:261:19)
+    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
+    at node:internal/main/run_main_module:33:47 {
+  errno: -4048,
+  code: 'EPERM',
+  syscall: 'mkdtemp',
+  path: 'C:\\Users\\teasp\\AppData\\Local\\Temp\\data-real-guard-XXXXXX'
+}
+
+Node.js v26.5.0
+
+hook: PostToolUse
+ succeeded in 793ms:
+## Subagent dispatch requires multi-agent support
+
+Add to your Codex config (`~/.codex/config.toml`):
+
+```toml
+[features]
+multi_agent = true
+```
+
+This enables the multi-agent tools that skills like
+`dispatching-parallel-agents` and `subagent-driven-development` use.
+Which tools you get depends on the multi-agent version your model
+preset selects (current presets run V2; older ones run V1). Trust your
+actual tool list over any table �?" including this one �?" when they
+disagree.
+
+- **Spawning:** give children a clean context with
+  `spawn_agent {fork_turns: "none"}`; the default `"all"` copies your
+  entire transcript into the child. On Codex 0.145+, role files under
+  `~/.codex/agents/` attach to isolated forks via `agent_type`.
+  Full-history forks accept `model` and `reasoning_effort` overrides
+  (only `agent_type` is refused there) �?" isolated forks are the SDD
+  default for context hygiene, not because overrides require them.
+- **Fix rounds:** resume the implementer with `followup_task` �?" it
+  delivers your message, triggers a turn, and transparently reloads a
+  child the harness evicted. Never dispatch a fresh implementer on the
+  theory that a spawned agent cannot be messaged again; on V2 it
+  always can.
+- **Lifecycle:** V2 has no `close_agent`. Finished children are
+  evicted automatically when slots are needed; leaving them unclosed
+  costs nothing. Only V1 sessions have `close_agent` �?" there, close
+  reviewers when their review returns, and close each implementer
+  after its task's review passes.
+- **Model names:** never copy a model name from a skill, table, or old
+  session into `spawn_agent` without checking it against your current
+  spawn allowlist �?" V2 accepts only V2-capable presets and hard-errors
+  on the rest.
+
+## Waiting on children
+
+`wait_agent` is an event subscription, not a poll: a long wait wakes
+the moment a child produces mailbox activity, with the same latency as
+a short one. Short-timeout polling buys nothing and costs a tool call �?"
+and a context rebill �?" per poll. In measured sessions, roughly
+two-thirds of all wait calls were short polls that timed out.
+
+- While you still have local work, do not wait at all. A completed
+  child's final answer is pushed into your mailbox and arrives with
+  your next turn.
+- When you are genuinely idle with children outstanding, wait in
+  bounded stretches: `wait_agent` with `timeout_ms` 300000-600000
+  (5-10 minutes). After each stretch �?" wake or timeout �?" post one
+  status line, run `list_agents`, and chase any child that finished
+  without reporting. Never stack polls shorter than five minutes; the
+  event subscription wakes a bounded stretch just as fast as a short
+  one.
+- Completion mail cannot wake an idle controller (it is delivered
+  without triggering a turn); covering that idle window is
+  `wait_agent`'s only job. A stretch that times out with no activity
+  is your cue to reconcile, not to shorten the next stretch.
+
+## Model routing on spawns
+
+Every `spawn_agent` you issue �?" including when you are yourself a
+spawned child running a fan-out �?" sets `model` AND `reasoning_effort`
+explicitly, per the Model Selection rules of the skill you are
+executing. Setting `model` alone is a trap: the child's effort
+silently resets to that model's default, not to yours.
+
+Ask your human partner to add a machine-level backstop to
+`~/.codex/config.toml` so any spawn that slips through still routes to
+a deliberate tier instead of silently inheriting the session's most
+expensive model:
+
+```toml
+[agents]
+default_subagent_model = "<a mid-tier model from your spawn allowlist>"
+default_subagent_reasoning_effort = "medium"
+```
+
+## Environment Detection
+
+Skills that create worktrees or finish branches should detect their
+environment with read-only git commands before proceeding:
+
+```bash
+GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
+GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
+BRANCH=$(git branch --show-current)
+```
+
+- `GIT_DIR != GIT_COMMON` �+' already in a linked worktree (skip creation)
+- `BRANCH` empty �+' detached HEAD (cannot branch/push/PR from sandbox)
+
+See `using-git-worktrees` Step 0 and `finishing-a-development-branch`
+Step 1 for how each skill uses these signals.
+
+## Codex App Finishing
+
+When the sandbox blocks branch/push operations (detached HEAD in an
+externally managed worktree), the agent commits all work and informs
+the user to use the App's native controls:
+
+- **"Create branch"** �?" names the branch, then commit/push/PR via App UI
+- **"Hand off to local"** �?" transfers work to the user's local checkout
+
+The agent can still run tests, stage files, and output suggested branch
+names, commit messages, and PR descriptions for the user to copy.
+
+hook: PostToolUse
+ succeeded in 844ms:
+commit d007e0b3dd547084be13d9330b60176632432eac
+Author:     Ian <iansomintac.contact@gmail.com>
+AuthorDate: Sun Oct 25 18:07:43 2026 -0700
+Commit:     Ian <iansomintac.contact@gmail.com>
+CommitDate: Sun Oct 25 18:07:43 2026 -0700
+
+    fit-finder: gate-check fails when data/real is tracked by git (studio-harness F3)
+    
+    New tools/data-real-guard.js (git ls-files -- data/real; fails closed),
+    called by gate-check.js on every run. Test first:
+    tools/data-real-guard-selftest.js in a throwaway repo with a fake file
+    (7 checks). Evidence: docs/evidence/2026-10-26-f3-data-real-guard.md.
+    
+    Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
+    Claude-Session: https://claude.ai/code/session_01FxbuZBzRD5fEEEsCr7ohwC
+
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+codex
+About 8 minutes left. The selftest was blocked at `mkdtemp` with EPERM, before it created a fixture. I’ll distinguish fresh in-memory checks from code inspection and the recorded red/green output. I also won’t run `gate-selftest.js`: it reads files outside your allowlist.
+hook: PreToolUse
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
+const fs = require('fs'), vm = require('vm'), path = require('path');
+const gateSource = fs.readFileSync('fit-finder/tools/gate-check.js', 'utf8');
+const guardSource = fs.readFileSync('fit-finder/tools/data-real-guard.js', 'utf8');
+const line = n => "'`first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits ${n} (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)`;
+function doc(stage, outcome) {
+  const n = outcome === '"'inconclusive' ? 5 : 8;
+  let s = "'`BASE-SHA: ae60341'"\\nBEFORE-LINE: "'${line(n)}'"\\nBEFORE: feature 17 of 29, wrong 2, no card "'${n}, not-a-fit 0'"\\nPREDICTION-PM: x\\nPREDICTION-LEAD: y\\n"'`;
+  if (outcome === '"'inconclusive') s += 'OUTCOME: inconclusive\\nREASON: before no-card < 6 (5)\\n';
+  else if (stage === 'final') {
+    const after = outcome === 'kept' ? 6 : 7;
+    s += "'`AFTER-LINE: ${line(after)}'"\\nAFTER: feature 17 of 29, wrong 2, no card "'${after}, not-a-fit 0'"\\nOUTCOME: "'${outcome}'"\\nREASON: "'${outcome === '"'kept' ? 'none' : 'no-card fall < 2 (8 to 7)'}\\nPREDICTION: "'${outcome === '"'kept' ? 'held' : 'did not hold'}\\n"'`;
+  }
+  return s;
+}
+function run(stage, outcome, noGit, result, cwdLabel) {
+  const calls = [], output = [], exit = {};
+  const spawnSync = (cmd, args, options) => { calls.push({cmd,args,cwd:options.cwd}); return result; };
+  const helper = {exports:{}};
+  vm.runInNewContext(guardSource,{require:n=>{if(n==='"'child_process')return {spawnSync};throw Error(n)},module:helper,console});
+  const root = path.resolve('fit-finder/tools');
+  let code=0;
+  try {vm.runInNewContext(gateSource, {
+    __dirname:root, console:{log:s=>output.push(s)},
+    process:{argv:['node','gate-check.js','memory-evidence','--stage',stage,...(noGit?['--no-git']:[])],cwd:()=>cwdLabel,exit:n=>{code=n;throw exit}},
+    require:n=>{if(n==='fs')return {readFileSync:()=>doc(stage,outcome)};if(n==='path')return path;if(n==='child_process')return {spawnSync};if(n==='./data-real-guard.js')return helper.exports;throw Error(n)}
+  });} catch(e) {if(e"'!==exit)throw e;}
+  return {code,output:output.join('"'\\n'),calls};
+}
+let count=0;
+for(const [stage,outcome] of [['before','pending'],['before','inconclusive'],['final','inconclusive'],['final','kept'],['final','reverted']]) {
+  for(const noGit of [true,false]) {
+    for(const cwd of ['C:/elsewhere','C:/space and [odd]/subfolder']) {
+      const r=run(stage,outcome,noGit,{status:0,stdout:'data/real/sub/odd name.jsonl\\n',stderr:''},cwd);
+      if(r.code"'!==1 || !r.output.includes('"'data/real is tracked by git:') || r.calls.length"'!==1 || r.calls[0].cwd!==path.resolve('"'fit-finder'))throw Error(JSON.stringify(r));
+      count++;
+    }
+  }
+}
+console.log("'`IN-MEMORY: ${count} tracked gate cases exit 1 across stage/outcome/no-git/caller-cwd; only guard called`);
+for(const [name,result] of [['"'not-repo',{status:128,stdout:'',stderr:'fatal: not a git repository'}],['missing-git',{status:null,stdout:null,stderr:null,error:{message:'spawnSync git ENOENT'}}],['other-failure',{status:1,stdout:'',stderr:'bad index'}],['signal',{status:null,stdout:'',stderr:''}],['buffer-overflow',{status:null,stdout:'x',error:{message:'ENOBUFS'}}]]) {
+  const r=run('before','pending',true,result,'C:/elsewhere');
+  if(r.code"'!==1 || !r.output.includes('"'git ls-files failed'))throw Error(JSON.stringify(r));
+  console.log("'`IN-MEMORY: ${name} -> gate exit ${r.code}`);
+}
+const control=run('"'before','pending',true,{status:0,stdout:'',stderr:''},'C:/elsewhere');
+if(control.code"'!==0)throw Error(JSON.stringify(control));
+console.log('"'IN-MEMORY: clean-index control -> gate exit 0');
+'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 636ms:
+IN-MEMORY: 20 tracked gate cases exit 1 across stage/outcome/no-git/caller-cwd; only guard called
+IN-MEMORY: not-repo -> gate exit 1
+IN-MEMORY: missing-git -> gate exit 1
+IN-MEMORY: other-failure -> gate exit 1
+IN-MEMORY: signal -> gate exit 1
+IN-MEMORY: buffer-overflow -> gate exit 1
+IN-MEMORY: clean-index control -> gate exit 0
+
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only prompt-coach...HEAD -- fit-finder/tools/data-real-guard.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
+const {spawnSync}=require('child_process'), path=require('path'),os=require('os');
+const cwd=path.resolve('fit-finder');
+const allowed=['ls-files','--','tools/data-real-guard.js'];
+for(const [name,extra] of [['normal',{}],['alternate missing index',{GIT_INDEX_FILE:path.join(os.tmpdir(),"'`f3-judge-absent-index-${process.pid}-${Date.now()}`)}],['"'redirected worktree',{GIT_WORK_TREE:os.tmpdir()}]]){
+ const r=spawnSync('git',allowed,{cwd,encoding:'utf8',env:{...process.env,...extra}});
+ console.log(JSON.stringify({name,status:r.status,allowedToolPaths:r.stdout.trim(),error:r.stderr.trim()}));
+}
+'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only prompt-coach...HEAD -- Fit-Finder/tools/data-real-guard.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only prompt-coach...HEAD -- fit-finder/TOOLS/data-real-guard.js' in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 319ms:
+fit-finder/tools/data-real-guard.js
+
+hook: PostToolUse
+ succeeded in 338ms:
+hook: PostToolUse
+ succeeded in 344ms:
+hook: PostToolUse
+ succeeded in 872ms:
+{"name":"normal","status":0,"allowedToolPaths":"tools/data-real-guard.js","error":""}
+{"name":"alternate missing index","status":0,"allowedToolPaths":"","error":""}
+{"name":"redirected worktree","status":0,"allowedToolPaths":"","error":""}
+
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+hook: PostToolUse Completed
+codex
+About 5 minutes left. I found a potential bypass through inherited Git environment variables: using an allowed tracked tool file as a safe proxy, both an alternate missing `GIT_INDEX_FILE` and a redirected `GIT_WORK_TREE` made Git return success with no paths. The guard inherits those variables. I’m checking Windows path matching before assigning severity.
+hook: PreToolUse
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
+const {spawnSync}=require('child_process'), path=require('path');
+const root=process.cwd();
+const tests=[
+ ['exact',path.join(root,'fit-finder'),['ls-files','--','tools/data-real-guard.js']],
+ ['uppercase file pathspec',path.join(root,'fit-finder'),['ls-files','--','tools/DATA-REAL-GUARD.js']],
+ ['uppercase pathspec ignorecase true',path.join(root,'fit-finder'),['-c','core.ignorecase=true','ls-files','--','tools/DATA-REAL-GUARD.js']],
+ ['uppercase cwd',path.join(root,'FIT-FINDER'),['ls-files','--','tools/data-real-guard.js']],
+ ['uppercase tools cwd',path.join(root,'fit-finder','TOOLS'),['ls-files','--','data-real-guard.js']],
+ ['icase pathspec',path.join(root,'fit-finder'),['ls-files','--',':(icase)tools/DATA-REAL-GUARD.js']]
+];
+for(const [name,cwd,args] of tests){const r=spawnSync('git',args,{cwd,encoding:'utf8'});console.log(JSON.stringify({name,status:r.status,allowedToolPaths:r.stdout,error:r.stderr}));}
+'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 782ms:
+{"name":"exact","status":0,"allowedToolPaths":"tools/data-real-guard.js\n","error":""}
+{"name":"uppercase file pathspec","status":0,"allowedToolPaths":"","error":""}
+{"name":"uppercase pathspec ignorecase true","status":0,"allowedToolPaths":"","error":""}
+{"name":"uppercase cwd","status":0,"allowedToolPaths":"tools/data-real-guard.js\n","error":""}
+{"name":"uppercase tools cwd","status":0,"allowedToolPaths":"data-real-guard.js\n","error":""}
+{"name":"icase pathspec","status":0,"allowedToolPaths":"tools/data-real-guard.js\n","error":""}
+
+hook: PostToolUse
+hook: PostToolUse Completed
+hook: PreToolUse
+hook: PreToolUse Completed
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
+const fs=require('fs'),vm=require('vm'),path=require('path');
+const source=fs.readFileSync('fit-finder/tools/data-real-guard.js','utf8');
+let output='';const calls=[];const m={exports:{}};
+vm.runInNewContext(source,{module:m,require:n=>({spawnSync:(cmd,args,opts)=>{calls.push({cmd,args,opts});return {status:0,stdout:output,stderr:''};}})});
+for(const [name,text] of [
+ ['spaces','data/real/fake file.jsonl\\n'],
+ ['subfolder','data/real/sub/deep/fake.jsonl\\n'],
+ ['quoted unusual name','\"data/real/a\\\\nb.jsonl\"\\n'],
+ ['tracked symlink path itself','data/real\\n'],
+ ['tracked gitlink at data/real','data/real\\n'],
+ ['tracked gitlink under data/real','data/real/submodule\\n'],
+ ['empty index','']
+]){output=text;const r=m.exports.trackedReal('C:/fixture with spaces/fit-finder');console.log(JSON.stringify({injectedGitResult:name,ok:r.ok,count:r.files.length,wouldReject:r.files.length>0}));}
+console.log('Exact spawn contract: '+JSON.stringify(calls[0]));
+'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
+ succeeded in 578ms:
+{"injectedGitResult":"spaces","ok":true,"count":1,"wouldReject":true}
+{"injectedGitResult":"subfolder","ok":true,"count":1,"wouldReject":true}
+{"injectedGitResult":"quoted unusual name","ok":true,"count":1,"wouldReject":true}
+{"injectedGitResult":"tracked symlink path itself","ok":true,"count":1,"wouldReject":true}
+{"injectedGitResult":"tracked gitlink at data/real","ok":true,"count":1,"wouldReject":true}
+{"injectedGitResult":"tracked gitlink under data/real","ok":true,"count":1,"wouldReject":true}
+{"injectedGitResult":"empty index","ok":true,"count":0,"wouldReject":false}
+Exact spawn contract: {"cmd":"git","args":["ls-files","--","data/real"],"opts":{"cwd":"C:/fixture with spaces/fit-finder","encoding":"utf8"}}
+
+hook: PostToolUse
+hook: PostToolUse Completed
+codex
+Two must-fixes prevent an unconditional pass.
+
+1. **Bind the check to the intended repository and index.** [data-real-guard.js:5](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/data-real-guard.js:5) inherits Git’s environment. Using only an allowed tracked tool file as a safe proxy, I measured:
+   - Normal environment: Git listed the tracked file.
+   - `GIT_INDEX_FILE` pointing to a nonexistent index: exit **0**, empty output.
+   - `GIT_WORK_TREE` redirected elsewhere: exit **0**, empty output.
+
+   The guard accepts both empty results. With `--no-git`, that permits otherwise-valid evidence to pass. Inherited Git variables can be an honest mistake; deliberately exploiting them also has a small fix. Clear repository/index overrides and anchor the intended repository. Apply the same isolation to the selftest’s Git commands, which currently inherit these variables too.
+
+2. **Handle Windows case variants.** The literal `data/real` pathspec is case-sensitive, even with `core.ignorecase=true`. I verified that behavior against allowed tool paths: exact spelling listed the tracked file; changed case returned exit **0** with nothing. An index entry under `data/REAL/...` can therefore escape this check while referring to the same Windows directory. Use case-insensitive matching on Windows and add a fixture case.
+
+The join itself is sound. At [gate-check.js:17](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/gate-check.js:17), guard failures enter `bad` before stage/outcome checks and before the `--no-git` condition. Nothing subsequently clears them. **Whenever the selected Git command returns paths or errors, the gate fails in every valid mode.**
+
+Fresh in-memory execution of the actual allowed source confirmed:
+
+- **20 tracked-output cases** exited 1 across before/final, pending/inconclusive/kept/reverted, both Git modes, and different caller directories.
+- Injected not-a-repository, missing-Git, other failure, signal, and buffer-overflow results each made the gate exit 1.
+- An empty successful result allowed the valid control to exit 0.
+
+The new selftest is **not vacuous under a normal environment**. It copies the actual gate and helper into a throwaway repo, establishes a passing control, stages a fake file, requires the gate to fail with that filename, then unstages it and requires another pass. Removing the join would fail its tracked-gate assertion. The outside-repository case tests only the helper.
+
+Test-first chronology is supported by the [recorded red/green output](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/docs/evidence/2026-10-26-f3-data-real-guard.md:16), especially the recorded failure with the join absent. One final commit cannot independently establish that chronology.
+
+Other bypass results and limits:
+
+| Attempt | Result |
+|---|---|
+| Caller cwd; paths containing spaces | In-memory checks rejected tracked output; gate anchors cwd to its script location. |
+| Staged but uncommitted file | Covered by the fixture’s code and recorded run; no commit is made. |
+| Subfolders; spaces or unusual filenames | Injected outputs were rejected; parsing needs only one nonempty line. |
+| Uppercase caller cwd | Actual safe Git probe still found the tracked tool file. |
+| Tracked `data/real` symlink or submodule | Inspection indicates detection: the symlink/gitlink path itself is listed. Injected outputs were rejected. |
+| Unregistered nested repo | Its independently tracked contents are outside the outer index. A nested repo at `fit-finder/` can also shadow the intended outer index; repository anchoring should address that. Not dynamically tested. |
+| Sparse checkout / skip-worktree | No filesystem-existence filter is present; these should remain visible through the index. Not dynamically tested. |
+| Another `data/real` elsewhere in the repo | Outside this check’s specified Fit Finder scope. |
+| Early exits and check order | Invalid arguments exit 2; unreadable evidence exits nonzero. Neither creates a successful bypass. Guard failures skip the later Git checks and reach exit 1. |
+
+The selftest run was blocked at `mkdtemp` with **EPERM**, before creating its fixture. I relied on code inspection and the recorded output for its filesystem behavior. I did not run `gate-selftest.js`, because it reads files outside your allowlist. No customer-data paths were opened or listed, and no files were edited.
+
+Verdict: FAIL
+hook: Stop
+hook: Stop Completed
+tokens used
+74,030
+Two must-fixes prevent an unconditional pass.
+
+1. **Bind the check to the intended repository and index.** [data-real-guard.js:5](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/data-real-guard.js:5) inherits Git’s environment. Using only an allowed tracked tool file as a safe proxy, I measured:
+   - Normal environment: Git listed the tracked file.
+   - `GIT_INDEX_FILE` pointing to a nonexistent index: exit **0**, empty output.
+   - `GIT_WORK_TREE` redirected elsewhere: exit **0**, empty output.
+
+   The guard accepts both empty results. With `--no-git`, that permits otherwise-valid evidence to pass. Inherited Git variables can be an honest mistake; deliberately exploiting them also has a small fix. Clear repository/index overrides and anchor the intended repository. Apply the same isolation to the selftest’s Git commands, which currently inherit these variables too.
+
+2. **Handle Windows case variants.** The literal `data/real` pathspec is case-sensitive, even with `core.ignorecase=true`. I verified that behavior against allowed tool paths: exact spelling listed the tracked file; changed case returned exit **0** with nothing. An index entry under `data/REAL/...` can therefore escape this check while referring to the same Windows directory. Use case-insensitive matching on Windows and add a fixture case.
+
+The join itself is sound. At [gate-check.js:17](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/gate-check.js:17), guard failures enter `bad` before stage/outcome checks and before the `--no-git` condition. Nothing subsequently clears them. **Whenever the selected Git command returns paths or errors, the gate fails in every valid mode.**
+
+Fresh in-memory execution of the actual allowed source confirmed:
+
+- **20 tracked-output cases** exited 1 across before/final, pending/inconclusive/kept/reverted, both Git modes, and different caller directories.
+- Injected not-a-repository, missing-Git, other failure, signal, and buffer-overflow results each made the gate exit 1.
+- An empty successful result allowed the valid control to exit 0.
+
+The new selftest is **not vacuous under a normal environment**. It copies the actual gate and helper into a throwaway repo, establishes a passing control, stages a fake file, requires the gate to fail with that filename, then unstages it and requires another pass. Removing the join would fail its tracked-gate assertion. The outside-repository case tests only the helper.
+
+Test-first chronology is supported by the [recorded red/green output](C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/docs/evidence/2026-10-26-f3-data-real-guard.md:16), especially the recorded failure with the join absent. One final commit cannot independently establish that chronology.
+
+Other bypass results and limits:
+
+| Attempt | Result |
+|---|---|
+| Caller cwd; paths containing spaces | In-memory checks rejected tracked output; gate anchors cwd to its script location. |
+| Staged but uncommitted file | Covered by the fixture’s code and recorded run; no commit is made. |
+| Subfolders; spaces or unusual filenames | Injected outputs were rejected; parsing needs only one nonempty line. |
+| Uppercase caller cwd | Actual safe Git probe still found the tracked tool file. |
+| Tracked `data/real` symlink or submodule | Inspection indicates detection: the symlink/gitlink path itself is listed. Injected outputs were rejected. |
+| Unregistered nested repo | Its independently tracked contents are outside the outer index. A nested repo at `fit-finder/` can also shadow the intended outer index; repository anchoring should address that. Not dynamically tested. |
+| Sparse checkout / skip-worktree | No filesystem-existence filter is present; these should remain visible through the index. Not dynamically tested. |
+| Another `data/real` elsewhere in the repo | Outside this check’s specified Fit Finder scope. |
+| Early exits and check order | Invalid arguments exit 2; unreadable evidence exits nonzero. Neither creates a successful bypass. Guard failures skip the later Git checks and reach exit 1. |
+
+The selftest run was blocked at `mkdtemp` with **EPERM**, before creating its fixture. I relied on code inspection and the recorded output for its filesystem behavior. I did not run `gate-selftest.js`, because it reads files outside your allowlist. No customer-data paths were opened or listed, and no files were edited.
+
+Verdict: FAIL
+exit 0
+````
diff --git a/fit-finder/tools/README.md b/fit-finder/tools/README.md
index 4d51b38..53a02df 100644
--- a/fit-finder/tools/README.md
+++ b/fit-finder/tools/README.md
@@ -16,7 +16,8 @@ Small scripts for the BCA run. Run them from `fit-finder/` (paths are relative t
 | `keep-check.js` | `<EV>` | `keep-check ok <outcome>` | 1 if the rule, the written REASON or the git state disagree |
 | `ops-check.js` | `<base sha>` | `ops-check ok <n> cards changed` | 1 on any violation |
 | `diag-nocard.js`, `diag-selftest.js` | `[--engine <path>]` (self-test only); selftest: none (needs `FF_LEDGER`) | `diag no-card N (tune T, halfA A); tune wrong W; tune not-a-fit K`; selftest `diag-selftest ok` | 1 with `INVALID: ...` if tune wrong > 4, tune not-a-fit > BASE_K or half A wrong > 0; 2 on bad input. Reads only the tune set and half A |
-| `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees |
+| `gate-check.js` | `<EV> --stage before|final [--no-git]` | `gate-check ok <stage> <outcome>; before feature R0 of F0 wrong W0 no-card N0 not-a-fit K0; after ...` | 1 with `gate-check FAIL: <reasons>` if a summary differs from its score line (feature count is `split: right feature first`), the keep rule, REASON or PREDICTION text is wrong, PREDICTION lines come after AFTER-LINE, or (without `--no-git`) the git state disagrees, or (always, even with `--no-git`) git tracks anything under `data/real` |
+| `data-real-guard.js`, `data-real-guard-selftest.js` | none | `data-real-guard ok` / `data-real-guard FAIL: data/real is tracked by git: <paths>`; `data-real-guard-selftest ok (20 checks)` | 1 if `git -C <fit-finder> ls-files` lists any path with a `data/real` segment (any case) or itself fails; inherited `GIT_DIR`, `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_OBJECT_DIRECTORY` are dropped first; lists paths only, never reads the files. The selftest uses a throwaway repo with a fake file |
 | `engine-scope.js`, `gate-selftest.js` | `--git <sha>` or `--files <base> <new>`; selftest: none | `engine-scope ok` / `engine-scope FAIL: <problems>`; `gate-selftest ok` | 1 if `engine/fit.js` differs from the base outside the `OPS` block and the `let fit;`..`return { fit,` gate block (line endings ignored), an OPS key changed, or an added line has Date/performance/location/http/fetch/require(/process |
 | `selftest.js` | none | `selftest ok` or `selftest FAIL: ...` | 1 on the first failure |
 
diff --git a/fit-finder/tools/data-real-guard-selftest.js b/fit-finder/tools/data-real-guard-selftest.js
new file mode 100644
index 0000000..cb9334e
--- /dev/null
+++ b/fit-finder/tools/data-real-guard-selftest.js
@@ -0,0 +1,77 @@
+/* node tools/data-real-guard-selftest.js : exercises data-real-guard.js and its call from gate-check.js in a throwaway git repo
+   (fake files only; the real data/real is never read). Prints data-real-guard-selftest ok or the first failure. */
+const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process');
+const fail = (m) => { console.log('data-real-guard-selftest FAIL: ' + m); process.exit(1); };
+const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-real-guard-'));
+const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
+
+// throwaway repo shaped like workiva: <repo>/fit-finder/tools/{gate-check,data-real-guard}.js copied from this checkout
+const repo = path.join(tmp, 'repo'), ff = path.join(repo, 'fit-finder');
+fs.mkdirSync(path.join(ff, 'tools'), { recursive: true });
+fs.mkdirSync(path.join(ff, 'data', 'real'), { recursive: true });
+for (const f of ['gate-check.js', 'data-real-guard.js']) fs.copyFileSync(path.join(__dirname, f), path.join(ff, 'tools', f));
+if (git(repo, 'init', '-q').status !== 0) fail('git init');
+fs.writeFileSync(path.join(ff, 'data', 'real', 'fake.jsonl'), '{"fake":"not real data"}\n');
+fs.writeFileSync(path.join(ff, 'README.md'), 'x\n');
+git(repo, 'add', 'fit-finder/README.md');
+
+// a valid before-stage evidence doc (no-card 8, so no OUTCOME needed)
+const line = 'first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits 8 (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)';
+const ev = path.join(tmp, 'ev.md');
+fs.writeFileSync(ev, ['BASE-SHA: ae60341', 'BEFORE-LINE: ' + line, 'BEFORE: feature 17 of 29, wrong 2, no card 8, not-a-fit 0', 'PREDICTION-PM: x', 'PREDICTION-LEAD: y'].join('\n') + '\n');
+const gate = (env = {}) => spawnSync('node', [path.join(ff, 'tools', 'gate-check.js'), ev, '--stage', 'before', '--no-git'], { encoding: 'utf8', env: { ...process.env, ...env } });
+const guard = (cwd, env = {}) => spawnSync('node', [path.join(ff, 'tools', 'data-real-guard.js')], { cwd, encoding: 'utf8', env: { ...process.env, GIT_CEILING_DIRECTORIES: tmp, ...env } });
+let n = 0;
+const expect = (name, r, code, re) => {
+  n++;
+  if (r.status !== code || !re.test(r.stdout)) fail(`${name}: want exit ${code} matching ${re}, got ${r.status}: ${(r.stdout + r.stderr).trim()}`);
+};
+
+// 1-2. control: data/real exists on disk but is untracked, so guard and done check pass
+expect('untracked guard', guard(ff), 0, /^data-real-guard ok/);
+expect('untracked gate', gate(), 0, /^gate-check ok before/);
+
+// 3-5. tracked: git add a file under data/real, and both fail naming it
+git(repo, 'add', '-f', 'fit-finder/data/real/fake.jsonl');
+expect('tracked guard', guard(ff), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
+expect('tracked gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
+const { trackedReal } = require(path.join(ff, 'tools', 'data-real-guard.js'));
+const t = trackedReal(ff);
+if (!t.ok || t.files.join() !== 'data/real/fake.jsonl') fail('trackedReal lists ' + JSON.stringify(t));
+n++;
+
+// 6-15. inherited git env vars that point git at another repo, index or tree must not hide the tracked file
+const other = path.join(tmp, 'other');
+fs.mkdirSync(other);
+git(other, 'init', '-q');
+const misleading = {
+  GIT_DIR: path.join(other, '.git'),
+  GIT_INDEX_FILE: path.join(tmp, 'empty-index'),
+  GIT_WORK_TREE: other,
+  GIT_COMMON_DIR: path.join(other, '.git'),
+  GIT_OBJECT_DIRECTORY: path.join(other, '.git', 'objects'),
+};
+for (const [k, v] of Object.entries(misleading)) {
+  expect(`${k} guard`, guard(ff, { [k]: v }), 1, /data-real-guard FAIL: .*data\/real\/fake\.jsonl/);
+  expect(`${k} gate`, gate({ [k]: v }), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/real\/fake\.jsonl/);
+}
+
+// 16. untrack again: passes again
+git(repo, 'rm', '-q', '--cached', 'fit-finder/data/real/fake.jsonl');
+expect('untracked again gate', gate(), 0, /^gate-check ok before/);
+
+// 17-19. a case variant (data/REAL) is caught too; put straight in the index so the test does not depend on the disk's case rules
+const blob = git(repo, 'hash-object', '-w', 'fit-finder/data/real/fake.jsonl').stdout.trim();
+git(repo, 'update-index', '--add', '--cacheinfo', `100644,${blob},fit-finder/data/REAL/x.jsonl`);
+expect('case variant guard', guard(ff), 1, /data-real-guard FAIL: .*data\/REAL\/x\.jsonl/);
+expect('case variant gate', gate(), 1, /gate-check FAIL: .*data\/real is tracked by git: data\/REAL\/x\.jsonl/);
+git(repo, 'update-index', '--force-remove', 'fit-finder/data/REAL/x.jsonl');
+expect('case variant removed gate', gate(), 0, /^gate-check ok before/);
+
+// 20. fails closed outside a git repo (git ls-files errors)
+const bare = path.join(tmp, 'not-a-repo');
+fs.mkdirSync(bare);
+expect('no repo guard', guard(bare), 1, /data-real-guard FAIL: git ls-files failed/);
+
+fs.rmSync(tmp, { recursive: true, force: true });
+console.log(`data-real-guard-selftest ok (${n} checks)`);
diff --git a/fit-finder/tools/data-real-guard.js b/fit-finder/tools/data-real-guard.js
new file mode 100644
index 0000000..a2acadd
--- /dev/null
+++ b/fit-finder/tools/data-real-guard.js
@@ -0,0 +1,21 @@
+/* node tools/data-real-guard.js : fails if git tracks anything under data/real (run from fit-finder/). Lists paths only, never reads the files.
+   Prints data-real-guard ok, or data-real-guard FAIL: <paths>. Exit 1 also when git ls-files itself fails (fails closed).
+   Inherited GIT_DIR-style env vars are dropped so they cannot point git at another repo or index, and the data/real
+   segment is matched in any case (data/REAL on Windows is the same folder). */
+const { spawnSync } = require('child_process');
+const DROP = ['GIT_DIR', 'GIT_INDEX_FILE', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY'];
+const REAL = /(^|\/)data\/real(\/|$)/i;
+function trackedReal(dir) {
+  const env = { ...process.env };
+  for (const k of Object.keys(env)) if (DROP.includes(k.toUpperCase())) delete env[k];
+  const r = spawnSync('git', ['-C', dir, 'ls-files', '-z'], { cwd: dir, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
+  if (r.status !== 0) return { ok: false, error: 'git ls-files failed: ' + (r.error ? r.error.message : (r.stderr || '').trim()) };
+  return { ok: true, files: r.stdout.split('\0').filter((f) => f && REAL.test(f)) };
+}
+module.exports = { trackedReal };
+if (require.main === module) {
+  const t = trackedReal(process.cwd());
+  if (!t.ok) { console.log('data-real-guard FAIL: ' + t.error); process.exit(1); }
+  if (t.files.length) { console.log('data-real-guard FAIL: data/real is tracked by git: ' + t.files.join(', ')); process.exit(1); }
+  console.log('data-real-guard ok');
+}
diff --git a/fit-finder/tools/gate-check.js b/fit-finder/tools/gate-check.js
index 54ffe57..6d691d4 100644
--- a/fit-finder/tools/gate-check.js
+++ b/fit-finder/tools/gate-check.js
@@ -13,6 +13,10 @@ const get = (tag) => {
   return i < 0 ? null : { i, v: lines[i].slice(tag.length).trim() };
 };
 const bad = [];
+// always, even with --no-git: real data must never be tracked (studio-harness F3)
+const real = require('./data-real-guard.js').trackedReal(root);
+if (!real.ok) bad.push(real.error);
+else if (real.files.length) bad.push('data/real is tracked by git: ' + real.files.join(', '));
 function parse(text) {
   const m = (re) => { const x = re.exec(text); return x ? +x[1] : NaN; };
   const s = /split: right feature first (\d+) of (\d+)/.exec(text);

hook: PostToolUse
 succeeded in 1445ms:
{"name":"control","status":0,"safeProxyPaths":"tools/data-real-guard.js\u0000","error":""}
{"name":"config-count core.worktree","status":0,"safeProxyPaths":"tools/data-real-guard.js\u0000","error":""}
{"name":"config-parameters core.worktree","status":0,"safeProxyPaths":"tools/data-real-guard.js\u0000","error":""}
{"name":"config-count core.bare","status":0,"safeProxyPaths":"tools/data-real-guard.js\u0000","error":""}
{"name":"ceiling equal cwd","status":0,"safeProxyPaths":"tools/data-real-guard.js\u0000","error":""}
{"name":"prefix unrelated","status":0,"safeProxyPaths":"tools/data-real-guard.js\u0000","error":""}
{"name":"implicit-work-tree 0","status":0,"safeProxyPaths":"tools/data-real-guard.js\u0000","error":""}
{"name":"namespace unrelated","status":0,"safeProxyPaths":"tools/data-real-guard.js\u0000","error":""}
{"name":"literal-pathspecs","status":0,"safeProxyPaths":"tools/data-real-guard.js\u0000","error":""}
{"name":"config-count sparse-checkout","status":0,"safeProxyPaths":"tools/data-real-guard.js\u0000","error":""}

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
The named environment overrides are removed, and the new NUL-separated, case-insensitive scan catches `data/REAL`. The throwaway selftest is blocked by `EPERM` at `mkdtemp`, before fixture creation. I’m now probing remaining Git settings with allowed tool filenames as safe proxies; about 10 minutes remain.
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const {spawnSync}=require('child_process'),path=require('path'),os=require('os');
const base={...process.env}; for(const k of Object.keys(base))if(k.toUpperCase().startsWith('GIT_'))delete base[k];
const dirs=[['linked worktree',path.resolve('fit-finder')],['main checkout','C:/Users/teasp/Documents/workiva/fit-finder']];
for(const [place,cwd] of dirs){
 for(const [name,extra] of [
  ['control',{}],
  ['config-count core.worktree',{GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'core.worktree',GIT_CONFIG_VALUE_0:os.tmpdir()}],
  ['config-parameters core.worktree',{GIT_CONFIG_PARAMETERS:\"'core.worktree=\"+os.tmpdir().replace(/\\\\/g,'/')+\"'\"}],
  ['config worktree+extension',{GIT_CONFIG_COUNT:'2',GIT_CONFIG_KEY_0:'core.worktree',GIT_CONFIG_VALUE_0:os.tmpdir(),GIT_CONFIG_KEY_1:'extensions.worktreeConfig',GIT_CONFIG_VALUE_1:'true'}],
  ['ceiling parent',{GIT_CEILING_DIRECTORIES:path.dirname(cwd)}],
  ['discovery filesystem',{GIT_DISCOVERY_ACROSS_FILESYSTEM:'0'}],
  ['invalid config',{GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'core.bare',GIT_CONFIG_VALUE_0:'invalid'}]
 ]){
 const r=spawnSync('git',['-C',cwd,'ls-files','-z','--','tools/gate-check.js'],{cwd,encoding:'utf8',env:{...base,...extra}});
 console.log(JSON.stringify({place,name,status:r.status,safeProxy:r.stdout,error:r.stderr}));
 }
}
'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 1206ms:
{"place":"linked worktree","name":"control","status":0,"safeProxy":"tools/gate-check.js\u0000","error":""}
{"place":"linked worktree","name":"config-count core.worktree","status":0,"safeProxy":"tools/gate-check.js\u0000","error":""}
{"place":"linked worktree","name":"config-parameters core.worktree","status":0,"safeProxy":"tools/gate-check.js\u0000","error":""}
{"place":"linked worktree","name":"config worktree+extension","status":0,"safeProxy":"tools/gate-check.js\u0000","error":""}
{"place":"linked worktree","name":"ceiling parent","status":128,"safeProxy":"","error":"fatal: not a git repository (or any of the parent directories): .git\n"}
{"place":"linked worktree","name":"discovery filesystem","status":0,"safeProxy":"tools/gate-check.js\u0000","error":""}
{"place":"linked worktree","name":"invalid config","status":0,"safeProxy":"tools/gate-check.js\u0000","error":""}
{"place":"main checkout","name":"control","status":0,"safeProxy":"tools/gate-check.js\u0000","error":""}
{"place":"main checkout","name":"config-count core.worktree","status":0,"safeProxy":"tools/gate-check.js\u0000","error":""}
{"place":"main checkout","name":"config-parameters core.worktree","status":0,"safeProxy":"tools/gate-check.js\u0000","error":""}
{"place":"main checkout","name":"config worktree+extension","status":0,"safeProxy":"tools/gate-check.js\u0000","error":""}
{"place":"main checkout","name":"ceiling parent","status":128,"safeProxy":"","error":"fatal: not a git repository (or any of the parent directories): .git\n"}
{"place":"main checkout","name":"discovery filesystem","status":0,"safeProxy":"tools/gate-check.js\u0000","error":""}
{"place":"main checkout","name":"invalid config","status":0,"safeProxy":"tools/gate-check.js\u0000","error":""}

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const {spawnSync}=require('child_process'),path=require('path'),os=require('os');
const cwd=path.resolve('fit-finder'); const base={...process.env};for(const k of Object.keys(base))if(k.toUpperCase().startsWith('GIT_'))delete base[k];
for(const [name,extra,args] of [
 ['config sentinel',{GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'f3.sentinel',GIT_CONFIG_VALUE_0:'present'},['config','--get','f3.sentinel']],
 ['bad count',{GIT_CONFIG_COUNT:'garbage'},['config','--get','f3.sentinel']],
 ['missing index',{GIT_INDEX_FILE:path.join(os.tmpdir(),'f3-no-such-index-independent-judge-20261025')},['ls-files','-z','--','tools/data-real-guard.js']],
 ['redirect tree',{GIT_WORK_TREE:os.tmpdir()},['ls-files','-z','--','tools/data-real-guard.js']],
 ['config parameters',{GIT_CONFIG_PARAMETERS:\"'f3.sentinel=present'\"},['config','--get','f3.sentinel']],
 ['direct command config',{},['-c','f3.sentinel=present','config','--get','f3.sentinel']],
 ['direct core.worktree',{},['-c','core.worktree='+os.tmpdir(),'ls-files','-z','--','tools/data-real-guard.js']]
 ]){const r=spawnSync('git',['-C',cwd,...args],{cwd,encoding:'utf8',env:{...base,...extra}});console.log(JSON.stringify({name,status:r.status,out:r.stdout,error:r.stderr}));}
'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 933ms:
{"name":"config sentinel","status":1,"out":"","error":""}
{"name":"bad count","status":1,"out":"","error":""}
{"name":"missing index","status":0,"out":"","error":""}
{"name":"redirect tree","status":0,"out":"","error":""}
{"name":"config parameters","status":0,"out":"present\n","error":""}
{"name":"direct command config","status":0,"out":"present\n","error":""}
{"name":"direct core.worktree","status":0,"out":"tools/data-real-guard.js\u0000","error":""}

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const {spawnSync}=require('child_process'),path=require('path'),os=require('os');
const cwd=path.resolve('fit-finder'),base={...process.env};for(const k of Object.keys(base))if(k.toUpperCase().startsWith('GIT_'))delete base[k];
const tests=[
 ['git version',{},['--version']],
 ['config core.worktree',{GIT_CONFIG_PARAMETERS:\"'core.worktree=\"+os.tmpdir().replace(/\\\\/g,'/')+\"'\"},['config','--get','core.worktree']],
 ['config bare invalid',{GIT_CONFIG_PARAMETERS:\"'core.bare=invalid'\"},['ls-files','-z','--','tools/gate-check.js']],
 ['config bare true',{GIT_CONFIG_PARAMETERS:\"'core.bare=true'\"},['ls-files','-z','--','tools/gate-check.js']],
 ['config extension worktree false',{GIT_CONFIG_PARAMETERS:\"'extensions.worktreeConfig=false' 'core.worktree=\"+os.tmpdir().replace(/\\\\/g,'/')+\"'\"},['ls-files','-z','--','tools/gate-check.js']],
 ['config relative alternate index',{GIT_CONFIG_PARAMETERS:\"'core.splitIndex=true'\"},['ls-files','-z','--','tools/gate-check.js']],
 ['super prefix',{GIT_INTERNAL_SUPER_PREFIX:'elsewhere/'},['ls-files','-z','--','tools/gate-check.js']]
 ];
for(const [name,extra,args]of tests){const r=spawnSync('git',['-C',cwd,...args],{cwd,encoding:'utf8',env:{...base,...extra}});console.log(JSON.stringify({name,status:r.status,out:r.stdout,error:r.stderr}));}
'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 2132ms:
{"name":"git version","status":0,"out":"git version 2.30.0.windows.1\n","error":""}
{"name":"config core.worktree","status":0,"out":"C:/Users/teasp/AppData/Local/Temp\n","error":""}
{"name":"config bare invalid","status":128,"out":"","error":"fatal: bad numeric config value 'invalid' for 'core.bare': invalid unit\n"}
{"name":"config bare true","status":0,"out":"tools/gate-check.js\u0000","error":""}
{"name":"config extension worktree false","status":0,"out":"tools/gate-check.js\u0000","error":""}
{"name":"config relative alternate index","status":0,"out":"tools/gate-check.js\u0000","error":""}
{"name":"super prefix","status":128,"out":"","error":"fatal: ls-files doesn't support --super-prefix\n"}

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const {spawnSync}=require('child_process'),path=require('path');
for(const cwd of [path.resolve('fit-finder'),'C:/Users/teasp/Documents/workiva/fit-finder']){
const r=spawnSync('git',['-C',cwd,'rev-parse','--git-dir','--git-common-dir','--show-toplevel'],{encoding:'utf8'});console.log(JSON.stringify({cwd,status:r.status,out:r.stdout,error:r.stderr}));
}
'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 874ms:
{"cwd":"C:\\Users\\teasp\\Documents\\workiva\\.claude\\worktrees\\f3-data-real-guard\\fit-finder","status":0,"out":"C:/Users/teasp/Documents/workiva/.git/worktrees/f3-data-real-guard\nC:/Users/teasp/Documents/workiva/.git\nC:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard\n","error":""}
{"cwd":"C:/Users/teasp/Documents/workiva/fit-finder","status":0,"out":"C:/Users/teasp/Documents/workiva/.git\n../.git\nC:/Users/teasp/Documents/workiva\n","error":""}

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const {spawnSync}=require('child_process'),path=require('path'),os=require('os');
for(const cwd of [path.resolve('fit-finder'),'C:/Users/teasp/Documents/workiva/fit-finder']){
for(const cmd of [['rev-parse','--show-toplevel','--show-prefix'],['config','--show-origin','--get-all','core.worktree']]){
const r=spawnSync('git',['-c','core.worktree='+os.tmpdir(),'-C',cwd,...cmd],{encoding:'utf8'});console.log(JSON.stringify({cwd,cmd,status:r.status,out:r.stdout,error:r.stderr}));
}}
'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 1184ms:
{"cwd":"C:\\Users\\teasp\\Documents\\workiva\\.claude\\worktrees\\f3-data-real-guard\\fit-finder","cmd":["rev-parse","--show-toplevel","--show-prefix"],"status":0,"out":"C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard\nfit-finder/\n","error":""}
{"cwd":"C:\\Users\\teasp\\Documents\\workiva\\.claude\\worktrees\\f3-data-real-guard\\fit-finder","cmd":["config","--show-origin","--get-all","core.worktree"],"status":0,"out":"command line:\tC:\\Users\\teasp\\AppData\\Local\\Temp\n","error":""}
{"cwd":"C:/Users/teasp/Documents/workiva/fit-finder","cmd":["rev-parse","--show-toplevel","--show-prefix"],"status":0,"out":"C:/Users/teasp/Documents/workiva\nfit-finder/\n","error":""}
{"cwd":"C:/Users/teasp/Documents/workiva/fit-finder","cmd":["config","--show-origin","--get-all","core.worktree"],"status":0,"out":"command line:\tC:\\Users\\teasp\\AppData\\Local\\Temp\n","error":""}

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const fs=require('fs'),vm=require('vm'),path=require('path');
const helper=fs.readFileSync('fit-finder/tools/data-real-guard.js','utf8');
const gate=fs.readFileSync('fit-finder/tools/gate-check.js','utf8');
function doc(stage,outcome){
 const n=outcome==='inconclusive'?5:8;
 const line=n=>"'`first card right: 20 of 33 that fit; wrong card 2 (a); no card where one fits ${n} (b); card on a not-a-fit prompt 0 (c); split: right feature first 17 of 29, rightly none 3 (x)`;
 const arr=['"'BASE-SHA: ae60341','BEFORE-LINE: '+line(n),"'`BEFORE: feature 17 of 29, wrong 2, no card ${n}, not-a-fit 0`,'"'PREDICTION-PM: x','PREDICTION-LEAD: y'];
 if(outcome==='inconclusive')arr.push('OUTCOME: inconclusive','REASON: before no-card < 6 (5)');
 else if(stage==='final'){const after=outcome==='kept'?6:7;arr.push('AFTER-LINE: '+line(after),"'`AFTER: feature 17 of 29, wrong 2, no card ${after}, not-a-fit 0`,'"'OUTCOME: '+outcome,'REASON: '+(outcome==='kept'?'none':'no-card fall < 2 (8 to 7)'),'PREDICTION: '+(outcome==='kept'?'held':'did not hold'));}
 return arr.join('\\n');
}
function run({stage='before',outcome='pending',noGit=true,result={status:0,stdout:'',stderr:''},cwd='C:/unrelated',env={}}={}){
 const calls=[],out=[],sentinel={};let status=0;
 const spawnSync=(cmd,args,options)=>{calls.push({cmd,args,options});return result;};
 const m={exports:{}};
 vm.runInNewContext(helper,{module:m,process:{env},require:n=>{if(n==='child_process')return {spawnSync};throw Error(n)}});
 try{vm.runInNewContext(gate,{__dirname:path.resolve('fit-finder/tools'),console:{log:x=>out.push(x)},process:{argv:['node','gate-check.js','memory-evidence','--stage',stage,...(noGit?['--no-git']:[])],cwd:()=>cwd,exit:n=>{status=n;throw sentinel}},require:n=>{if(n==='fs')return {readFileSync:()=>doc(stage,outcome)};if(n==='path')return path;if(n==='child_process')return {spawnSync};if(n==='./data-real-guard.js')return m.exports;throw Error(n)}});}catch(e){if(e"'!==sentinel)throw e;}
 return {status,out:out.join('"'\\n'),calls};
}
let count=0;
for(const [stage,outcome]of [['before','pending'],['before','inconclusive'],['final','inconclusive'],['final','kept'],['final','reverted']])for(const noGit of [true,false])for(const cwd of ['C:/elsewhere','C:/space and [odd]/subdir']){
const r=run({stage,outcome,noGit,cwd,result:{status:0,stdout:'data/REAL/sub/odd\\nname.jsonl\\0',stderr:''}});if(r.status"'!==1||!r.out.includes('"'data/real is tracked by git:')||r.calls.length"'!==1)throw Error(JSON.stringify(r));count++;
}
console.log(`${count} full-gate tracked-output cases: exit 1; later Git checks skipped`);
for(const [name,result]of [['"'not-repo',{status:128,stdout:'',stderr:'not a repo'}],['missing-git',{status:null,stdout:null,error:{message:'ENOENT'}}],['other-error',{status:1,stdout:'',stderr:'bad index'}],['signal',{status:null,stdout:'',stderr:''}],['overflow',{status:null,stdout:'data/real/fake\\0',error:{message:'ENOBUFS'}}]]){
const r=run({result});if(r.status"'!==1||!r.out.includes('"'git ls-files failed'))throw Error(name);console.log("'`${name}: full gate exit 1`);}
for(const [name,output,blocked]of [['"'space','data/real/a b.jsonl\\0',true],['newline','data/real/a\\nb.jsonl\\0',true],['case','DATA/ReAl/x\\0',true],['symlink or gitlink path','data/real\\0',true],['subfolder','data/real/sub/deep/x\\0',true],['nested data real','archive/data/real/x\\0',true],['only contains real','data/really/x\\0real/data/x\\0mydata/real/x\\0',false],['empty','',false]]){
const r=run({result:{status:0,stdout:output}});if(r.status"'!==(blocked?1:0))throw Error(name);console.log(`${name}: full gate exit ${r.status}`);}
const env={PATH:'"'safe',GIT_DIR:'x',git_index_file:'x',Git_Work_Tree:'x',GIT_COMMON_DIR:'x',GIT_OBJECT_DIRECTORY:'x',GIT_CONFIG_PARAMETERS:\"'f3.sentinel=kept'\",GIT_CONFIG_COUNT:'1',GIT_CEILING_DIRECTORIES:'x'};
const r=run({env});console.log('helper retained environment names: '+Object.keys(r.calls[0].options.env).join(', '));
if(Object.keys(r.calls[0].options.env).some(k=>['GIT_DIR','GIT_INDEX_FILE','GIT_WORK_TREE','GIT_COMMON_DIR','GIT_OBJECT_DIRECTORY'].includes(k.toUpperCase())))throw Error('env not removed');
console.log('safe control: full gate exit '+run().status);
'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 530ms:
20 full-gate tracked-output cases: exit 1; later Git checks skipped
not-repo: full gate exit 1
missing-git: full gate exit 1
other-error: full gate exit 1
signal: full gate exit 1
overflow: full gate exit 1
space: full gate exit 1
newline: full gate exit 1
case: full gate exit 1
symlink or gitlink path: full gate exit 1
subfolder: full gate exit 1
nested data real: full gate exit 1
only contains real: full gate exit 0
empty: full gate exit 0
helper retained environment names: PATH, GIT_CONFIG_PARAMETERS, GIT_CONFIG_COUNT, GIT_CEILING_DIRECTORIES
safe control: full gate exit 0

hook: PostToolUse
hook: PostToolUse Completed
codex
Fresh in-memory runs of the actual gate rejected tracked output in 20 mode combinations and rejected all five simulated Git failures. Two concerns remain in the code: a nested repo at `fit-finder/` can change which index the guard checks, and the selftest’s setup commands still inherit repository/index overrides. I’m checking those limits before the verdict; about 5 minutes remain.
hook: PreToolUse
hook: PreToolUse Completed
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const fs=require('fs'),vm=require('vm'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const source=fs.readFileSync('fit-finder/tools/data-real-guard.js','utf8');
const ff=path.resolve('fit-finder'),root=path.resolve('.');
const base={...process.env};for(const k of Object.keys(base))if(k.toUpperCase().startsWith('GIT_'))delete base[k];
for(const [name,extra]of [['control',{}],['GIT_DIR',{GIT_DIR:'C:/Users/teasp/Documents/workiva/.git'}],['GIT_WORK_TREE',{GIT_WORK_TREE:os.tmpdir()}],['GIT_INDEX_FILE',{GIT_INDEX_FILE:path.join(os.tmpdir(),'f3-independent-nonexistent-index-20261025')}],['GIT_COMMON_DIR',{GIT_COMMON_DIR:'C:/Users/teasp/Documents/workiva/.git'}],['GIT_OBJECT_DIRECTORY',{GIT_OBJECT_DIRECTORY:path.join(os.tmpdir(),'no-objects')}],['GIT_CONFIG_PARAMETERS',{GIT_CONFIG_PARAMETERS:\"'core.worktree=\"+os.tmpdir().replace(/\\\\/g,'/')+\"'\"}],['GIT_CEILING_DIRECTORIES',{GIT_CEILING_DIRECTORIES:root}]]){
 const module={exports:{}};let child;
 vm.runInNewContext(source,{module,process:{env:{...base,...extra}},require:n=>{
 if(n"'!=='"'child_process')throw Error(n);
 return {spawnSync:(cmd,args,opt)=>{child=spawnSync(cmd,[...args,'--','tools/data-real-guard.js'],opt);return {...child,stdout:child.stdout?.replaceAll('tools/data-real-guard.js','data/real/SYNTHETIC-PROXY.jsonl')};}};
 }});
 const result=module.exports.trackedReal(ff);
 console.log(JSON.stringify({name,gitStatus:child.status,proxyDetected:result.ok&&result.files.length===1,error:result.error}));
}
const env={...base,GIT_DIR:'C:/Users/teasp/Documents/workiva/.git',GIT_WORK_TREE:'C:/Users/teasp/Documents/workiva'};
const git=(cwd,...args)=>spawnSync('git',args,{cwd,encoding:'utf8',env});
const r=git(ff,'rev-parse','--show-toplevel');console.log('Selftest git wrapper, inherited overrides, metadata-only probe: '+JSON.stringify({status:r.status,selectedRoot:r.stdout.trim(),intendedRoot:root}));
'@ | node -" in C:\Users\teasp\Documents\workiva\.claude\worktrees\f3-data-real-guard
 succeeded in 820ms:
{"name":"control","gitStatus":0,"proxyDetected":true}
{"name":"GIT_DIR","gitStatus":0,"proxyDetected":true}
{"name":"GIT_WORK_TREE","gitStatus":0,"proxyDetected":true}
{"name":"GIT_INDEX_FILE","gitStatus":0,"proxyDetected":true}
{"name":"GIT_COMMON_DIR","gitStatus":0,"proxyDetected":true}
{"name":"GIT_OBJECT_DIRECTORY","gitStatus":0,"proxyDetected":true}
{"name":"GIT_CONFIG_PARAMETERS","gitStatus":0,"proxyDetected":true}
{"name":"GIT_CEILING_DIRECTORIES","gitStatus":128,"proxyDetected":false,"error":"git ls-files failed: fatal: not a git repository (or any of the parent directories): .git"}
Selftest git wrapper, inherited overrides, metadata-only probe: {"status":0,"selectedRoot":"C:/Users/teasp/Documents/workiva","intendedRoot":"C:\\Users\\teasp\\Documents\\workiva\\.claude\\worktrees\\f3-data-real-guard"}

hook: PostToolUse
hook: PostToolUse Completed
codex
Two must-fixes remain.

1. **A nested repository can hide the intended index.** [data-real-guard.js:11](/C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/data-real-guard.js:11) uses `git -C <fit-finder>`, which discovers the nearest repository. If someone accidentally runs `git init` inside `fit-finder/`, the guard checks that new, empty index. Files already tracked under `fit-finder/data/real` in the outer repository disappear from its view, and valid `--stage before --no-git` evidence passes.

   This is a code-derived bypass; I could not create the nested fixture in this sandbox. The fix is small: verify that Git selected the expected repository root, or explicitly bind the query to that repository, accounting for linked worktrees. Add a throwaway nested-repository regression test.

2. **The selftest’s setup commands remain vulnerable to inherited Git overrides.** [data-real-guard-selftest.js:6](/C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/data-real-guard-selftest.js:6) still inherits the entire environment for `init`, `add`, `rm --cached`, `hash-object -w`, and `update-index`. Therefore, its Git operations are not confined to the throwaway fixture.

   A metadata-only probe using that wrapper confirmed that inherited `GIT_DIR`/`GIT_WORK_TREE` selected the main checkout instead of this worktree. An inherited `GIT_INDEX_FILE` likewise directs fixture staging at another index. The selftest may fail eventually, but only after touching the wrong repository or index. Sanitize its setup environment and verify fixture-command exit statuses. This part of the previous judge’s first requested fix remains unresolved.

The two **specific production bypasses** previously demonstrated are fixed:

- The helper removes all five named repository/index overrides, including mixed-case environment names. Fresh probes executing the actual helper with Git restricted to an allowed tool-file proxy detected that proxy under each override.
- `ls-files -z` plus the case-insensitive regex catches `data/REAL/...`. NUL separation also handles embedded newlines correctly.

The gate integration is sound once Git selects the intended index. [gate-check.js:17](/C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/gate-check.js:17) runs the guard before outcome handling and outside the `--no-git` condition. Nothing clears its failures. Fresh in-memory execution of the actual gate and helper confirmed:

- **20 combinations** covering before/final, pending/inconclusive/kept/reverted, both Git modes, and different caller directories rejected tracked output.
- Simulated not-a-repository, missing-Git, other Git failure, signal termination, and output overflow each produced gate exit **1**.
- A clean-index control passed.

The new selftest genuinely tests the copied production gate/helper join. Its passing control, tracked-file failure naming the fixture path, and passing control after removal prevent an unrelated failure from satisfying the test. The case test inserts an uppercase path directly into the fixture index, so it exercises the intended fix independently of Windows filesystem casing.

The `GIT_DIR`, `GIT_INDEX_FILE`, and `GIT_WORK_TREE` cases exercise meaningful previous bypasses. `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` checks are useful regressions, but do not prove the fix: the evidence explicitly records that they already passed before it.

Test-first chronology is supported by the [recorded red/green evidence](/C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/docs/evidence/2026-10-26-f3-data-real-guard.md:16), including failure with the join absent and the later environment/case failures. Commit history does not independently establish that chronology.

Other attempts and minor notes:

| Attempt | Result and evidence |
|---|---|
| Different caller cwd; spaces in paths | Gate anchors its query to the script directory. Fresh in-memory checks rejected tracked output. |
| Spaces, newlines, unusual filenames; subfolders | Fresh injected NUL-separated outputs were rejected. |
| Staged but uncommitted files | Covered by the fixture code and recorded run; it makes no commit. |
| Tracked `data/real` symlink or gitlink | Its exact index path matches. Fresh injected output was rejected; actual symlink/submodule creation was not tested. |
| Nested repo/submodule beneath `data/real` | A tracked gitlink matches. Independently tracked child contents are not entries in the outer index. |
| `GIT_CEILING_DIRECTORIES` | A safe actual-Git probe returned 128; the helper rejected it. |
| `GIT_PREFIX`, namespace, implicit-worktree and pathspec variables | Safe tool-file probes found no bypass. There is no supplied pathspec for pathspec variables to weaken. |
| `GIT_CONFIG_PARAMETERS`, command-line config | Tested worktree/bare settings did not hide the safe proxy here. Invalid bare configuration returned 128. |
| `GIT_CONFIG_COUNT` | Installed Git is **2.30.0.windows.1**; a sentinel showed these settings were not applied. This is an unverified configuration route, not demonstrated protection. |
| Sparse checkout / skip-worktree | Inspection indicates cached entries remain visible; no filesystem-presence filter exists. Actual index mutations were not tested. |
| Another `data/real` elsewhere | Outside `fit-finder/` is not scanned. Inside it, even `archive/data/real/...` is rejected—broader than the required root directory. |
| Names merely containing “real” | Injected `data/really`, `real/data`, and `mydata/real` paths passed. |
| Early exits | Invalid arguments exit 2; unreadable evidence throws nonzero. Neither permits success before the guard. |
| Output limit | The 256 MiB limit can cause a conservative failure on a huge index. Simulated overflow failed closed. |

The throwaway selftest could not run: `mkdtemp` returned **EPERM** before fixture creation. Filesystem-test conclusions therefore rely on inspection and recorded output. I did not execute `gate-selftest.js`, which reads outside your allowlist. No files were edited, and no protected customer-data paths were opened or listed.

Verdict: FAIL
hook: Stop
hook: Stop Completed
tokens used
53,078
Two must-fixes remain.

1. **A nested repository can hide the intended index.** [data-real-guard.js:11](/C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/data-real-guard.js:11) uses `git -C <fit-finder>`, which discovers the nearest repository. If someone accidentally runs `git init` inside `fit-finder/`, the guard checks that new, empty index. Files already tracked under `fit-finder/data/real` in the outer repository disappear from its view, and valid `--stage before --no-git` evidence passes.

   This is a code-derived bypass; I could not create the nested fixture in this sandbox. The fix is small: verify that Git selected the expected repository root, or explicitly bind the query to that repository, accounting for linked worktrees. Add a throwaway nested-repository regression test.

2. **The selftest’s setup commands remain vulnerable to inherited Git overrides.** [data-real-guard-selftest.js:6](/C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/data-real-guard-selftest.js:6) still inherits the entire environment for `init`, `add`, `rm --cached`, `hash-object -w`, and `update-index`. Therefore, its Git operations are not confined to the throwaway fixture.

   A metadata-only probe using that wrapper confirmed that inherited `GIT_DIR`/`GIT_WORK_TREE` selected the main checkout instead of this worktree. An inherited `GIT_INDEX_FILE` likewise directs fixture staging at another index. The selftest may fail eventually, but only after touching the wrong repository or index. Sanitize its setup environment and verify fixture-command exit statuses. This part of the previous judge’s first requested fix remains unresolved.

The two **specific production bypasses** previously demonstrated are fixed:

- The helper removes all five named repository/index overrides, including mixed-case environment names. Fresh probes executing the actual helper with Git restricted to an allowed tool-file proxy detected that proxy under each override.
- `ls-files -z` plus the case-insensitive regex catches `data/REAL/...`. NUL separation also handles embedded newlines correctly.

The gate integration is sound once Git selects the intended index. [gate-check.js:17](/C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/fit-finder/tools/gate-check.js:17) runs the guard before outcome handling and outside the `--no-git` condition. Nothing clears its failures. Fresh in-memory execution of the actual gate and helper confirmed:

- **20 combinations** covering before/final, pending/inconclusive/kept/reverted, both Git modes, and different caller directories rejected tracked output.
- Simulated not-a-repository, missing-Git, other Git failure, signal termination, and output overflow each produced gate exit **1**.
- A clean-index control passed.

The new selftest genuinely tests the copied production gate/helper join. Its passing control, tracked-file failure naming the fixture path, and passing control after removal prevent an unrelated failure from satisfying the test. The case test inserts an uppercase path directly into the fixture index, so it exercises the intended fix independently of Windows filesystem casing.

The `GIT_DIR`, `GIT_INDEX_FILE`, and `GIT_WORK_TREE` cases exercise meaningful previous bypasses. `GIT_COMMON_DIR` and `GIT_OBJECT_DIRECTORY` checks are useful regressions, but do not prove the fix: the evidence explicitly records that they already passed before it.

Test-first chronology is supported by the [recorded red/green evidence](/C:/Users/teasp/Documents/workiva/.claude/worktrees/f3-data-real-guard/docs/evidence/2026-10-26-f3-data-real-guard.md:16), including failure with the join absent and the later environment/case failures. Commit history does not independently establish that chronology.

Other attempts and minor notes:

| Attempt | Result and evidence |
|---|---|
| Different caller cwd; spaces in paths | Gate anchors its query to the script directory. Fresh in-memory checks rejected tracked output. |
| Spaces, newlines, unusual filenames; subfolders | Fresh injected NUL-separated outputs were rejected. |
| Staged but uncommitted files | Covered by the fixture code and recorded run; it makes no commit. |
| Tracked `data/real` symlink or gitlink | Its exact index path matches. Fresh injected output was rejected; actual symlink/submodule creation was not tested. |
| Nested repo/submodule beneath `data/real` | A tracked gitlink matches. Independently tracked child contents are not entries in the outer index. |
| `GIT_CEILING_DIRECTORIES` | A safe actual-Git probe returned 128; the helper rejected it. |
| `GIT_PREFIX`, namespace, implicit-worktree and pathspec variables | Safe tool-file probes found no bypass. There is no supplied pathspec for pathspec variables to weaken. |
| `GIT_CONFIG_PARAMETERS`, command-line config | Tested worktree/bare settings did not hide the safe proxy here. Invalid bare configuration returned 128. |
| `GIT_CONFIG_COUNT` | Installed Git is **2.30.0.windows.1**; a sentinel showed these settings were not applied. This is an unverified configuration route, not demonstrated protection. |
| Sparse checkout / skip-worktree | Inspection indicates cached entries remain visible; no filesystem-presence filter exists. Actual index mutations were not tested. |
| Another `data/real` elsewhere | Outside `fit-finder/` is not scanned. Inside it, even `archive/data/real/...` is rejected—broader than the required root directory. |
| Names merely containing “real” | Injected `data/really`, `real/data`, and `mydata/real` paths passed. |
| Early exits | Invalid arguments exit 2; unreadable evidence throws nonzero. Neither permits success before the guard. |
| Output limit | The 256 MiB limit can cause a conservative failure on a huge index. Simulated overflow failed closed. |

The throwaway selftest could not run: `mkdtemp` returned **EPERM** before fixture creation. Filesystem-test conclusions therefore rely on inspection and recorded output. I did not execute `gate-selftest.js`, which reads outside your allowlist. No files were edited, and no protected customer-data paths were opened or listed.

Verdict: FAIL
````
