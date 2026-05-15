import { apiPut } from "../../lib/api";
import type { WeeklyDropBallot } from "./types";

export async function submitNextMovieBallot(targetDropId: number, rankedMovieIds: number[]) {
  return apiPut<WeeklyDropBallot>(
    `/api/v1/drops/${targetDropId}/ballot`,
    { ranked_movie_ids: rankedMovieIds },
    true,
  );
}
