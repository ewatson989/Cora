// netlify/functions/get-memories.js
export async function handler() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
    headers: {
      "X-Master-Key": process.env.JSONBIN_API_KEY
    }
  });

  const json = await res.json();
  const record = json.record || {};
  const entries = Object.values(record);

  return {
    statusCode: 200,
    body: JSON.stringify(entries)
  };
}
