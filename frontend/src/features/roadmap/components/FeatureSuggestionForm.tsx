import { useState, type FormEvent } from "react";
import { Lightbulb, Send } from "lucide-react";

import { submitFeatureSuggestion } from "../api";

type FeatureSuggestionFormProps = {
  signedIn: boolean;
  onLogin: () => void;
};

function errorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail === "string"
  ) {
    return (error as { response: { data: { detail: string } } }).response.data.detail;
  }
  return fallback;
}

export function FeatureSuggestionForm({ signedIn, onLogin }: FeatureSuggestionFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);
    try {
      await submitFeatureSuggestion({
        title,
        description: description.trim() || null,
      });
      setTitle("");
      setDescription("");
      setMessage("Suggestion sent. An admin will review it before anything appears publicly.");
    } catch (err) {
      setError(errorMessage(err, "Could not submit suggestion."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!signedIn) {
    return (
      <div className="relative overflow-hidden border-l border-zinc-800 bg-zinc-950/40 p-6">
        <div>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-red-500/30 bg-red-950/25 text-red-300">
            <Lightbulb size={22} />
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-white">Suggest the next feature.</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Members can send ideas into the admin review queue. Approved suggestions can become public roadmap items.
          </p>
          <button
            type="button"
            onClick={onLogin}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 text-sm font-black text-white transition-all duration-300 hover:bg-red-700"
          >
            Sign in to suggest
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border-l border-zinc-800 bg-zinc-950/40 p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-red-500">Feature Suggestions</p>
          <h2 className="mt-2 text-2xl font-black tracking-tighter text-white">Send an idea to the queue.</h2>
        </div>
        <div className="hidden h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-red-400 sm:flex">
          <Lightbulb size={20} />
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Title</span>
          <input
            value={title}
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition-colors focus:border-red-500"
            placeholder="What should Reel Review add next?"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">
            Details
          </span>
          <textarea
            value={description}
            maxLength={1200}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-32 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition-colors focus:border-red-500"
            placeholder="What problem would this solve? What should it feel like?"
          />
        </label>
      </div>

      {message ? (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm font-semibold text-emerald-200">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm font-semibold text-red-200">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-black text-white transition-all duration-300 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send size={16} />
        {submitting ? "Sending..." : "Submit Suggestion"}
      </button>
    </form>
  );
}
