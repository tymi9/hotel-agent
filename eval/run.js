// Eval: run every case in cases.csv through the agent (log_request stubbed),
// let the model grade each answer with rubric.md, and write a Markdown table.
import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { parse } from "csv-parse/sync";
import { runAgent, POLICIES } from "../server/agent.js";

const client = new Anthropic();
const MODEL = "claude-sonnet-5-5";

const cases = parse(fs.readFileSync("eval/cases.csv", "utf8"), { columns: true });
const rubric = fs.readFileSync("eval/rubric.md", "utf8");

// The grade comes back as JSON that must match this schema (structured outputs).
const GRADE_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer", enum: [1, 2, 3, 4, 5] },
    sentence: { type: "string" },
  },
  required: ["score", "sentence"],
  additionalProperties: false,
};

async function grade(c, out) {
  const output = {
    department: out.department,
    urgency: out.urgency,
    summary: out.summary,
    status: out.status,
    final_text: out.reply,
    tool_results: out.toolResults,
  };
  const prompt =
    rubric +
    "\n\n# Hotel policies\n\n" + POLICIES +
    "\n\n# Case\n\n" +
    `Guest name: ${c.name}\nGuest e-mail: ${c.email}\nGuest message: ${c.message}\n\n` +
    `Expected behaviour: ${c.expected}\n\n` +
    "Assistant's output:\n" + JSON.stringify(output, null, 2);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
    output_config: { format: { type: "json_schema", schema: GRADE_SCHEMA } },
  });
  const text = response.content.find((b) => b.type === "text").text;
  return JSON.parse(text);
}

async function runCase(c) {
  try {
    const out = await runAgent({ name: c.name, email: c.email, message: c.message }, { stub: true });
    const g = await grade(c, out);
    return { c, outcome: `${out.status}: ${out.reply}`, score: g.score, sentence: g.sentence };
  } catch (err) {
    return { c, outcome: "error", score: "", sentence: String(err.message || err) };
  }
}

// Table cells: no line breaks, and escape the | character.
const cell = (v) => String(v ?? "").replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|");

const results = await Promise.all(cases.map(runCase)); // all cases at the same time

const lines = [
  "| id | message | expected | outcome | score | sentence |",
  "|---|---|---|---|---|---|",
  ...results.map((r) =>
    "| " + [r.c.id, r.c.message, r.c.expected, r.outcome, r.score, r.sentence].map(cell).join(" | ") + " |"
  ),
];
const table = lines.join("\n") + "\n";

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp =
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-` +
  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
fs.mkdirSync("eval/results", { recursive: true });
const file = `eval/results/${stamp}.md`;
fs.writeFileSync(file, table);

console.log(table);
console.log(`Saved to ${file}`);
