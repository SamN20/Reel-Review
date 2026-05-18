# AGENTS.md

Shared instructions for coding assistants working in this repository.

## Purpose

This file standardizes how AI agents contribute to Reel Review so issue-based and branch-based collaboration stays predictable for maintainers and new contributors.

## Read First

Before making changes, review:

1. `README.md`
2. `CONTRIBUTING.md`
3. `SECURITY.md`

## Workflow Expectations

1. Work from an issue for non-trivial changes.
2. Use focused branches: `feature/<name>`, `fix/<name>`, `chore/<name>`.
3. Keep pull requests small and scoped.
4. In PR descriptions include:
   - What changed
   - Why it changed
   - How it was tested
   - Linked issue(s)

## Local Development

Prefer Docker for parity with deployment:

```bash
docker compose up --build
```

For direct Python workflows, use the documented virtualenv setup in `README.md`.

## Environment Safety

Reel Review now has distinct local/dev, beta, and production environments.

1. Treat `.env` as legacy/local convenience unless the maintainer explicitly says otherwise for the current task.
2. Treat `.env.prod` as the production source of truth for hosted production commands.
3. Treat `.env.beta` as the beta source of truth for hosted beta commands.
4. Never copy values between prod and beta casually; keep separate database names, ports, callback URLs, compose project names, and service identifiers where applicable.
5. When changing deployment, Docker, Make, backup, restore, migration, or environment configuration:
   - preserve separation between beta and production
   - prefer the explicit `make prod-*` and `make beta-*` targets
   - call out clearly in notes which environment a change affects
6. Do not run destructive or state-changing production or beta commands unless the user explicitly asks for that environment.
7. If updating env templates or docs, keep examples for both `reelreview.bynolo.ca` and `beta-reelreview.bynolo.ca` aligned.

## Validation Before PR

Run project checks after making changes:

```bash
make lint
make test
```

For formatting-only updates when needed:

```bash
make format
```

## Codebase Notes

- Backend application code is in `backend/app/`.
- Frontend work is in `frontend/` (React + Vite).
- Configuration and Docker files are in the root.

## V2 Migration Guardrails

1. Keep API changes backward-compatible where practical.
2. Prioritize endpoint contract clarity and consistent error responses.
3. Add or update tests for behavior changes, especially API routes.
4. Keep documentation updated as features evolve.

## Security Guardrails

1. Never commit secrets, `.env` files, production data, or local DB artifacts.
2. Do not add credentials to code, docs, logs, tests, or examples.
3. Follow `SECURITY.md` for vulnerability handling.

## Agent Behavior

1. Make minimal, targeted changes.
2. Do not refactor unrelated code.
3. Preserve existing style unless a task explicitly requests cleanup.
4. If assumptions are required, state them clearly in the PR notes.
5. If blocked by missing context, ask maintainers concise questions.
6. Build reusable parts and centralize logic (e.g., using a single source of truth for calculations) to minimize repeated code and simplify maintenance.

## Definition Of Done

A task is ready for review when:

1. Requested behavior is implemented.
2. Relevant tests pass locally.
3. Lint checks pass.
4. Documentation is updated for user-facing or contributor-facing changes.
5. PR description includes test evidence and linked issue.
