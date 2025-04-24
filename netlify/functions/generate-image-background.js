import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID      // required for sk-proj keys
});

export async function handler(event) {
  const { prompt = "", jobId } = JSON.parse(event.body || "{}");
  if (!prompt || !jobId) {
    return { statusCode: 400, body: "Missing prompt or jobId" };
  }

  console.log("📨 Job", jobId, "started");
  ...
  // when you save the result, use the supplied jobId
}


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

// instead of POST /b
await fetch(`https://api.jsonbin.io/v3/b/${YOUR_BIN_ID}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "X-Master-Key": process.env.JSONBIN_API_KEY
  },
  body: JSON.stringify({ [jobId]: url })
});

    })
    .catch((err) => console.error("❌ Job", jobId, err));

return { statusCode: 202 };

}
