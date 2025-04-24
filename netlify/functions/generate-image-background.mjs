import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID
});

export async function handler(event) {
  const { prompt = "", jobId } = JSON.parse(event.body || "{}");
  if (!prompt || !jobId) {
    return { statusCode: 400, body: "Missing prompt or jobId" };
  }

  console.log("📨 Job", jobId, "started");

  // Run in the background
  openai.images
    .generate({
      model: "gpt-image-1",          // 1024×1024 only
      prompt,
      n: 1,
      size: "1024x1024"
    })
    .then(async (resp) => {
      const url = (resp && resp.data && resp.data[0] && resp.data[0].url) || "";
      console.log("✅ Job", jobId, "URL:", url);

console.log("📦 Saving", url, "to JSONBin bin", process.env.JSONBIN_BIN_ID);

      
      // Merge this job into a single JSONBin document
      await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": process.env.JSONBIN_API_KEY
        },
        body: JSON.stringify({ [jobId]: url })
      });
    })
    .catch((err) => console.error("❌ Job", jobId, err));

  // Background functions must return quickly
  return { statusCode: 202 };
}
