// netlify/functions/generate-text.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID       // keep if you use sk-proj keys
});

export async function handler(event) {
  // Parse JSON from POST body
  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  // Support either { prompt: "Hi" } or { messages: [...] }
  let messages = body.messages || [];
  if (!messages.length && body.prompt) {
    messages = [{ role: "user", content: body.prompt }];
  }
  if (!messages.length) {
    return json(400, { error: "Missing prompt or messages array" });
  }

  // Kid-friendly system persona
  const systemPrompt =
    "You are explaining things to a 9-year-old child. " +
    "Use simple words, friendly examples, and avoid violence, scary themes, " +
    "adult content, or bad language.  Make sure you contain the response in no more than 800 tokens";

  try {
const { messages = [], temperature = 0.7 } = JSON.parse(event.body || "{}");

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  temperature,
  max_tokens: 800,
  messages: [
    { role: "system", content: systemPrompt },
    ...messages
  ]
});


    const text = completion.choices[0].message.content.trim();
    return json(200, { text });
  } catch (err) {
    console.error(err);
    return json(500, { error: "Failed to generate text" });
  }
}

// helper: consistent JSON response
function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj)
  };
}
