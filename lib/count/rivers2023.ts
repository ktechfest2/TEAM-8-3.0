import announced from "@/data/rivers-2023/announced.json";
import published from "@/data/rivers-2023/published.json";
import type { AnnouncedArea, CountTrailInput, PublishedUnit } from "./trail";

/** Shown wherever these figures appear. See data/rivers-2023/SOURCE.md. */
export const RIVERS_2023 = {
  election: "2023 presidential election",
  state: { code: "32", name: "Rivers" },
  source: "CCIJ, read from result sheets on INEC's results portal",
  sourceUrl: "https://github.com/anndawn/Nigeria-2023-election",
  announcedSource: "Local-government figures released by INEC under a freedom-of-information request",
} as const;

/** REAL data: Rivers State, 2023 presidential election. Published results per polling unit and announced local-government results. */
export function rivers2023(): CountTrailInput {
  return {
    state: RIVERS_2023.state,
    units: published as PublishedUnit[],
    announced: announced as AnnouncedArea[],
  };
}
