import type { Metadata } from "next";
import { Ask } from "@/components/app/Ask";
import { defaultMismatchQuestion } from "@/lib/notes/prompt";
import { recordedNotes } from "@/lib/notes/recorded";

export const metadata: Metadata = { title: "When a rumour spreads · Tallie" };

export default async function AskPage({ searchParams }: { searchParams: Promise<{ about?: string }> }) {
  const { about } = await searchParams;
  const code = about && /^\d{2}\/\d{2}$/.test(about) ? about : undefined;
  const question = code ? defaultMismatchQuestion(code) : null;

  // Offer the questions that already have a recorded note, in English, rumours first.
  const suggestions = recordedNotes()
    .filter((n) => n.lang === "en")
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "rumour" ? -1 : 1))
    .map((n) => n.asked);

  return <Ask suggestions={suggestions} initial={code && question ? { question, about: code } : undefined} />;
}
