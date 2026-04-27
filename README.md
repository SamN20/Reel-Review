# Reel Review - byNolo

A full-stack monorepo for movie reviews and ratings. Sister site of [Vinyl Vote](https://vinylvote.bynolo.ca).

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

## Contributing

Please see [AGENTS.md](AGENTS.md) for contribution guidelines and [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

This project is licensed under the AGPLv3 License - see the [LICENSE.txt](LICENSE.txt) file for details.
