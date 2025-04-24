import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID      // required for sk-proj keys
});

export async function handler(event) {
  const { prompt = "" } = JSON.parse(event.body || "{}");
  if (!prompt) {
    return { statusCode: 400, body: "Missing prompt" };
  }

  const jobId = uuidv4();
  console.log("📨 Job", jobId, "started");

  // Fire-and-forget: Netlify keeps running in the background
  openai.images
    .generate({
      model: "gpt-image-1",          // 1024×1024 only (for now)
      prompt,
      n: 1,
      size: "1024x1024"
    })
    .then(async (resp) => {
      const url = resp.data?.[0]?.url;
      console.log("✅ Job", jobId, "URL:", url);

      // Save URL → JSONBin
      await fetch(`https://api.jsonbin.io/v3/b`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": process.env.JSONBIN_API_KEY
        },
        body: JSON.stringify({ jobId, url })
      });
    })
    .catch((err) => console.error("❌ Job", jobId, err));

  return {
    statusCode: 202,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId })
  };
}
