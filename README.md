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

### Admin Settings Framework

Reel Review stores site-wide configuration in the `admin_settings` table. Each row has a `key` and a JSON `value`, which keeps settings flexible for future additions.

Current setting keys:
- `leaderboards`: Per-leaderboard minimum rating thresholds (managed in the Admin Panel > Settings).
- `drop_selection`: User Vote shortlist sizing for next-movie voting (managed in the Admin Panel > Settings).

### Weekly Drop Selection

Weekly drops can be scheduled from the Admin Panel > Weekly Drops calendar.

Supported drop modes:
- **Admin Pick**: The admin chooses the movie directly when scheduling the drop.
- **User Vote**: The movie is chosen by ranked community voting from a shared shortlist of pool movies.
- **Random Pool**: The movie is selected automatically from eligible pool movies.

The backend runs an in-process scheduler that checks the weekly rollover at Monday `00:00` Eastern time (`America/New_York`). On startup it also runs a catch-up check in case the backend was offline during the scheduled rollover. Admins can also use **Run Rollover** in the Weekly Drops calendar as a manual safety lever; it targets the currently visible calendar week.

#### User Vote Flow

When the next scheduled drop is a **User Vote** drop, users are prompted to rank next-week movie options after submitting their current weekly rating. Ballots are editable until the current drop closes on Sunday night.

Every user sees the same stored shortlist for that target drop. Admins can generate the shortlist from the Weekly Drops calendar before ballots are submitted. Once ballots exist, the shortlist is locked so users are voting on the same options.

At rollover, the backend counts ranked ballots using instant-runoff voting:
- Each ballot counts for its highest-ranked movie that has not been eliminated.
- If a movie has a majority, it wins.
- If no movie has a majority, the lowest vote-getter is eliminated and those ballots are redistributed.
- Ties are broken deterministically by smart score, then shortlist order, then movie id.
- If no ballots were submitted, the first smart-ranked option wins.

The winning movie is assigned to the weekly drop, removed from the pool, and then behaves like a normal scheduled drop.

#### Smart Picks And Wildcards

User Vote shortlists are configured in Admin Panel > Settings. The default mix is:
- `6` total options
- `4` smart picks
- `2` wildcards

Eligible movies must be in the pool and not already scheduled or already resolved into a drop.

Smart picks are scored from stored site data:
- Genre overlap with movies the community rated well.
- Director, cast, and keyword overlap where metadata exists.
- Approved movie request support as a small boost.

Wildcards are selected from the remaining eligible pool with a deterministic seed based on the target drop. This keeps the shortlist stable after it is generated while still adding surprise.

#### Random Pool

Random Pool drops choose one eligible pool movie at rollover using a deterministic seed based on the target drop. The selected movie is assigned to that drop and removed from the pool.

### Database Migrations

The backend now applies Alembic migrations automatically when the backend container starts. To run them manually against a running dev stack:

```bash
make db-migrate
```

## Contributing

Please see [AGENTS.md](AGENTS.md) for contribution guidelines and [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

This project is licensed under the AGPLv3 License - see the [LICENSE.txt](LICENSE.txt) file for details.
