import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID
});

export async function handler(event) {
  const { prompt = "" } = JSON.parse(event.body || "{}");
  if (!prompt) {
    return { statusCode: 400, body: "Missing prompt" };
  }

  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",      
      //model: "dall-e-2",    
      prompt,
      n: 1,
      size: "1024x1024"
    });

    const url = response.data?.[0]?.url;
    if (!url) throw new Error("No URL returned");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Image generation failed" })
    };
  }
}
