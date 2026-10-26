import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "subway-surfers-re-codex-connector",
    model,
    configured: Boolean(apiKey)
  });
});

app.post("/api/chat", async (req, res) => {
  const { message, history = [], systemPrompt = "You help with game development and coding tasks for Subway Surfers RE." } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      error: "The 'message' field is required and must be a string."
    });
  }

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured. Add it to your .env file before starting the connector."
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Failed to call the ChatGPT API.",
        details: data
      });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({
        error: "No response content was returned by the model."
      });
    }

    return res.json({
      ok: true,
      model,
      reply,
      raw: data
    });
  } catch (error) {
    console.error("ChatGPT connector failed:", error);

    return res.status(500).json({
      error: "Unexpected connector error.",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

app.listen(port, () => {
  console.log(`ChatGPT Codex connector listening on http://localhost:${port}`);
});
