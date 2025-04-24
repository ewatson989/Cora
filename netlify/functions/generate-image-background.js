
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID
});

export async function handler(event) {
  const { prompt } = JSON.parse(event.body || "{}");
  const jobId = uuidv4();

  try {
const response = await openai.images.generate({
  model: "dall-e-2",
  prompt,
  n: 1,
  size: "1024x1024"
});

if (!response || !response.data || !response.data[0]?.url) {
  console.error("❌ No image URL returned from OpenAI:", response);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: "OpenAI did not return an image URL" })
  };
}

const url = response.data[0].url;
console.log("✅ Image URL saved:", url);

console.log("📦 Saving to JSONBin with jobId:", jobId);

    // Save to JSONBin
    await fetch(`https://api.jsonbin.io/v3/b/${jobId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": process.env.JSONBIN_API_KEY
      },
      body: JSON.stringify({ url })
    });

    console.log("✅ Image URL saved:", url);


return {
-  statusCode: 202,
-  body: JSON.stringify({ jobId })
+  statusCode: 202,
+  headers: { "Content-Type": "application/json" },   // ← add this
+  body: JSON.stringify({ jobId })
};

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Image generation failed" })
    };
  }
}
