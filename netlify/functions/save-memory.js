// netlify/functions/save-memory.js
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const memory = JSON.parse(event.body || "{}");

  const res = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
    method: "GET",
    headers: {
      "X-Master-Key": process.env.JSONBIN_API_KEY
    }
  });

  const json = await res.json();
  const all = json.record || {};
  const newKey = Date.now().toString();

  all[newKey] = memory;

  const put = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
    method: "PUT",
    headers: {
      "X-Master-Key": process.env.JSONBIN_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(all)
  });

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}


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
