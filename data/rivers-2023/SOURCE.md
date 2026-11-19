# Rivers State, 2023 presidential election

Real data, used to show the count trail on a case where a mismatch was independently reported (BBC, "Nigeria election: The mystery of the altered results in disputed poll", https://www.bbc.com/news/65163713).

## Where it comes from

All three raw files are extracts of the dataset published by the Center for Collaborative Investigative Journalism (CCIJ) at https://github.com/anndawn/Nigeria-2023-election. Credit for collecting and reading the result sheets is theirs. The repository carries no licence file; this slice is used with attribution for a hackathon prototype.

| File here | Source file | What it is |
| --- | --- | --- |
| `rivers_voter_info.csv` | `voter_info.csv`, rows whose polling-unit code starts `32/` | Figures per polling unit, read from the result sheets on INEC's results portal |
| `rivers_apu.csv` | `AllPollingUnitsInfo.csv`, same rows, no header row | Names of each polling unit, ward and local government, and a link to the result-sheet image |
| `lga.csv` | `LGALevelResult.csv`, whole file | Local-government figures INEC released under a freedom-of-information request |

`published.json` and `announced.json` are built from those by `npx tsx scripts/build-rivers.ts`.

## What to know before trusting a number

- **Coverage is partial.** 5,316 of 6,866 polling units have figures. 858 sheets were never uploaded and 692 could not be read.
- **Figures were machine-read**, then cross-checked against volunteer transcription. Small differences are reading noise.
- **Four parties only**: APC, LP, PDP, NNPP. Rejected ballots are not included.
- **No ward figures were ever announced**, so ward sums cannot be compared with anything.
- One polling-unit name (`32/11/16/011`) was cut off in extraction and is shown as "Polling unit 011".
