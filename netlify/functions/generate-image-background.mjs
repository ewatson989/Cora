// netlify/functions/generate-image-background.mjs
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID
});

export async function handler(event) {
  const { prompt = "", jobId = uuidv4() } = JSON.parse(event.body || "{}");
  if (!prompt) return { statusCode: 400, body: "Missing prompt" };

  console.log("📨 Job", jobId, "started");

  // run in background
  openai.images
    .generate({
      model: "gpt-image-1",   // 1024×1024 only
      prompt,
      n: 1,
      size: "1024x1024"
    })
    .then(async (resp) => {
      const url =
        resp && resp.data && resp.data[0] && resp.data[0].url
          ? resp.data[0].url
          : "";

      if (!url) {
        console.error("❌ No URL returned from OpenAI:", JSON.stringify(resp));
        return;
      }
      console.log("✅ Job", jobId, "URL:", url);

      // save (PUT) into a single JSONBin
      const jbRes = await fetch(
        `https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Master-Key": process.env.JSONBIN_API_KEY
          },
          body: JSON.stringify({ [jobId]: url })
        }
      );

      if (!jbRes.ok) {
        const jbText = await jbRes.text();
        console.error("❌ JSONBin save failed:", jbRes.status, jbText);
      } else {
        console.log("📦 Saved URL for job", jobId, "status:", jbRes.status);
      }
    })
    .catch((err) => console.error("❌
