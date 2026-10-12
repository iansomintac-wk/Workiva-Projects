# Working agreement

Interim defaults for cloud sessions in this repo. The owner's personal CLAUDE.md replaces this
file when they add it; until then, follow these.

## Agents
- Research and lookups: smallest capable model (Haiku) at low effort, narrow questions, reply
  capped (e.g. under 250 words). Say which model and effort each agent used.
- Use the larger model only where quality decides the outcome: labeled data, design judgment,
  final review.
- Run independent agents in parallel; wait for results instead of redoing their work.

## Scope and planning
- Multi-step work: give a short plan and assumptions first. Ask only when a decision is
  genuinely the owner's; otherwise pick a sensible default and say so.
- Keep a task list on longer jobs.

## Verification
- Measure before claiming: tests, held-out data, or a check in the real page/app.
- Report failures, limits, and anything not tested as plainly as successes.

## Changes and git
- Small, reviewable steps. Commit locally at checkpoints on a feature branch, never on main.
- Never push, open a PR, or publish a new artifact unless asked. Updating an already-published
  artifact the owner asked to change is fine.

## Context and communication
- Summarize large files and outputs; don't paste them.
- Short updates: what changed, the evidence, what's next.

## Data care
- Nothing customer-specific or sensitive goes to external services. Flag anything sensitive.
- Product names and availability claims (Workiva AI agents, knowledge bases) must be confirmed
  before anything customer-facing ships.

# Repo map
- `project/` — Claude Design handoff bundle (prototypes, design system, chat transcript). Read-only reference.
- `sustainability-explainer/` — React + three.js build of the Sustainability explainer (`npm run build`).
- `prompt-coach/` — offline SCOPE prompt grader: engine, data, tests, build. See its README.
