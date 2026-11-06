// Web server: serves the pages in public/ and the two API routes.
import express from "express";
import { runAgent, readRequests } from "./agent.js";

const app = express();
app.use(express.json());
app.use(express.static("public"));

// Guest sends a message; the reply goes straight back to the page.
app.post("/api/message", async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Please fill in your name, e-mail and message." });
  }
  try {
    const result = await runAgent({ name, email, message });
    res.json({ reply: result.reply }); // the guest sees only the final text
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sorry, something went wrong. Please try again in a moment." });
  }
});

// Staff page data, newest first.
app.get("/api/requests", (req, res) => {
  res.json(readRequests().reverse());
});

app.get("/staff", (req, res) => {
  res.sendFile("staff.html", { root: "public" });
});

app.listen(3000, () => {
  console.log("Guest page: http://localhost:3000");
  console.log("Staff page: http://localhost:3000/staff");
});
