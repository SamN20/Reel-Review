const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop";

export function getBackdropUrl(path: string | null, size: "w780" | "original" = "w780") {
  if (!path) {
    return FALLBACK_IMAGE;
  }
  if (path.startsWith("http")) {
    return path;
  }
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getReleaseYear(releaseDate: string | null) {
  return releaseDate ? new Date(releaseDate).getFullYear().toString() : "N/A";
}
