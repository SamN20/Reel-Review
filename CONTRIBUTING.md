# Contributing to Reel Review

Thanks for your interest in contributing.

## Ground Rules

- Be respectful and collaborative.
- Open an issue for non-trivial changes before implementation.
- Keep PRs focused and small.
- Never commit secrets, production data, or local DB files.

Use GitHub templates when opening issues and PRs:

- Issue templates: `.github/ISSUE_TEMPLATE/`
- PR template: `.github/pull_request_template.md`

## Development Setup

The easiest way to develop locally is using Docker Compose via the provided Makefile.

1. **Setup Environment**:
   ```bash
   make setup
   ```

2. **Run Dev Stack**:
   ```bash
   make dev
   ```

This will start the backend (FastAPI), frontend (Vite), and database (Postgres) with hot-reloading enabled.

For direct work in specific directories:
- **Backend**: Uses Poetry. See `backend/README.md` (if exists) or run `poetry install` in `backend/`.
- **Frontend**: Uses npm. Run `npm install` in `frontend/`.

Run checks:

```bash
make test-backend
make test-frontend
```

## Branching and PRs

- Branch naming: `feature/<name>`, `fix/<name>`, `chore/<name>`.
- Create branches from an issue whenever practical and reference the issue in the PR.
- Include a short PR description with:
  - What changed
  - Why it changed
  - How it was tested
- Link related issues.

Recommended flow:

1. Open an issue using a template.
2. Create a focused branch for that issue.
3. Implement a minimal scoped change.
4. Run checks (`make test-backend` and `make test-frontend`).
5. Open a PR using the PR template and link the issue.

## Commit Style

Prefer Conventional Commits:

- `feat: add voting card API`
- `fix: handle missing spotify track id`
- `chore: add ci workflow`

## Codebase Notes

- **Backend**: FastAPI app in `backend/app/`.
- **Frontend**: React/Vite app in `frontend/`.
- **Infrastructure**: Docker and Nginx configs in the root and `proxy/`.

Refer to `AGENTS.md` for specific guidance on how AI assistants contribute to this codebase.

## Security

Please do not report security issues publicly. See `SECURITY.md`.
