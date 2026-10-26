# Subway Surfers RE - ChatGPT Codex Connector

This repository includes a minimal Node.js HTTP connector that sends messages to ChatGPT/Codex-compatible APIs and returns the model output.

## Features

- Health check endpoint at `/health`
- Chat endpoint at `/api/chat`
- Reads configuration from a local `.env` file
- Works with OpenAI-compatible APIs

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

3. Add your API key to `.env`:

   ```env
   OPENAI_API_KEY=your_key_here
   OPENAI_MODEL=gpt-4o-mini
   ```

   If you want to use a Codex model, replace `OPENAI_MODEL` with a supported value such as `codex-mini-latest` or another model available in your ChatGPT/OpenAI account.

4. Start the connector:

   ```bash
   npm start
   ```

## Example request

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Design a fast-paced endless runner feature for Subway Surfers RE.",
    "systemPrompt": "You are a game design and coding assistant for Subway Surfers RE."
  }'
```

## API contract

POST `/api/chat`

Request body:

```json
{
  "message": "Generate a mission system for the game.",
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ],
  "systemPrompt": "Additional assistant instructions"
}
```

Response:

```json
{
  "ok": true,
  "model": "gpt-4o-mini",
  "reply": "Generated text from the model"
}
```

## Notes

This is intentionally lightweight so it can be expanded into a production connector for game automation, moderation, or AI-powered gameplay support.
