import { useEffect } from "react";

const DEFAULT_DESCRIPTION =
  "A cinematic, community-driven weekly movie club where the byNolo community rates one featured film together.";

type PageMeta = {
  title: string;
  description?: string;
};

function ensureMetaDescriptionTag() {
  let tag = document.querySelector('meta[name="description"]');

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", "description");
    document.head.appendChild(tag);
  }

  return tag;
}

export function applyPageMeta({ title, description = DEFAULT_DESCRIPTION }: PageMeta) {
  document.title = title;
  ensureMetaDescriptionTag().setAttribute("content", description);
}

export function usePageMeta(meta: PageMeta) {
  const { title, description } = meta;

  useEffect(() => {
    applyPageMeta({ title, description });
  }, [description, title]);
}
