# Reel Review - byNolo

A cinematic, community-driven movie rating application and synchronized weekly event for the byNolo community. Sister site of [Vinyl Vote](https://vinylvote.bynolo.ca).

## Core Premise

Reel Review is built around a weekly event where the community watches and rates one specific movie. 

- **Weekly Drop**: A new movie is revealed on Monday.
- **Blind Voting**: Live stats are hidden during the week to prevent bias. Voting locks on Sunday night.
- **The Film Shelf**: A dynamically sorted archive of past movies, styled like a premium streaming service.
- **Community**: Spoiler-protected discussions, watch party coordination, and gamified engagement.

For detailed planning and design specifications, see the `docs/` directory. UI mockups can be found in the `mockups/` directory.
## Tech Stack

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12+) with [Poetry](https://python-poetry.org/)
- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Infrastructure**: [Docker](https://www.docker.com/) & [Nginx](https://www.nginx.com/)

## Project Structure

```text
.
├── backend/          # FastAPI application
├── frontend/         # React/Vite application
├── proxy/            # Nginx configuration
├── docker-compose.yml       # Dev orchestration
├── docker-compose.prod.yml  # Prod orchestration
└── Makefile          # Project shortcuts
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Make (optional, but recommended)

### Local Development

1. **Setup Environment**:
   ```bash
   make setup
   ```
   This copies `.env.example` to `.env`.

2. **Start Development Stack**:
   ```bash
   make dev
   ```
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Adminer (DB Viewer): [http://localhost:8080](http://localhost:8080)

### Testing

- **Backend**: `make test-backend`
- **Frontend**: `make test-frontend`

### Database Migrations

The backend now applies Alembic migrations automatically when the backend container starts. To run them manually against a running dev stack:

```bash
make db-migrate
```

## Contributing

Please see [AGENTS.md](AGENTS.md) for contribution guidelines and [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

This project is licensed under the AGPLv3 License - see the [LICENSE.txt](LICENSE.txt) file for details.
