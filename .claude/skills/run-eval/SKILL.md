---
name: run-eval
description: Evaluate the Hotel Estrella assistant. Use when the user asks to evaluate the app, run the eval, or check whether a prompt change helped. Runs npm run eval, compares the scores with the previous run in eval/results, lists the cases whose score changed, and suggests one system-prompt change without making it.
---

# Run the eval and compare with the last run

The eval sends real requests to the model (six cases plus six grading calls), so it costs a little money each time.

## 1. Run the eval

From the project folder:

```bash
PATH="$HOME/.local/node/bin:$PATH" npm run eval
```

It prints a Markdown table and ends with `Saved to eval/results/<date>-<time>.md`. That file is the **new run**.
If the command fails, show the error and stop.

## 2. Find the previous run

List `eval/results/*.md`. The file names sort by date and time, so the **previous run** is the newest file before the new one.
If there is no previous file, say this is the first run, show the scores, and skip to step 4.

## 3. List the cases whose score changed

Both files are tables with the columns id, message, expected, outcome, score, sentence. Match rows by **id** and compare **score**.

Show only the cases whose score changed, as a short table:

| id | message (short) | before | after | judge's sentence (new run) |

Then one line with the totals, for example: "Total: 29/30 before, 28/30 now. 1 case went down, 0 went up."
If no score changed, say so in one line.

A score that shows `error` is a failed run, not a grade: report it as an error, not as a drop.

## 4. Suggest one change to the system prompt (don't make it)

The system prompt is `PROMPT_TEXT` in `server/agent.js`.
Look at the lowest-scoring cases and the judge's sentences, and suggest **one** concrete change:
- quote the line you would change, or say where a new sentence would go;
- give the exact new wording;
- say which case it should help, and what it might make worse.

**Do not edit the system prompt, hotel-policies.md or the data files.** The project rules only allow that when the user asks. Wait for the user to decide.
