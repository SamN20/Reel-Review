-- scripts/clear_prod_db.sql
-- Purge production data while preserving `users` and `admin_settings`.
-- WARNING: This is destructive. BACKUP your DB first.

BEGIN;

-- Remove child records first to satisfy foreign keys
DELETE FROM review_reports;
DELETE FROM review_likes;
DELETE FROM review_replies;

-- Ratings reference movies and weekly_drops
DELETE FROM ratings;

-- Weekly drop related records
DELETE FROM weekly_drop_ballots;
DELETE FROM weekly_drop_options;
DELETE FROM weekly_drops;

-- Movie requests and supporters
DELETE FROM movie_request_supporters;
DELETE FROM movie_requests;

-- Finally remove movies
DELETE FROM movies;

-- Optionally clean up any other application-owned tables here if present.

-- Reset serial sequences for the cleared tables (best-effort; assumes default naming convention)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'movies', 'weekly_drops', 'weekly_drop_options', 'weekly_drop_ballots',
    'ratings', 'review_replies', 'review_likes', 'review_reports',
    'movie_requests', 'movie_request_supporters'
  ])
  LOOP
    BEGIN
      EXECUTE format('ALTER SEQUENCE %I_id_seq RESTART WITH 1', t);
    EXCEPTION WHEN undefined_table THEN
      -- ignore if sequence/table doesn't exist
      NULL;
    END;
  END LOOP;
END
$$;

COMMIT;

-- End of script
