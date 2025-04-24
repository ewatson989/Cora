export async function handler(event) {
  const jobId = event.queryStringParameters.jobId;
  if (!jobId) return { statusCode: 400, body: "Missing jobId" };

  try {
    const res = await fetch(
      `https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`,
      { headers: { "X-Master-Key": process.env.JSONBIN_API_KEY } }
    );

    const json = await res.json();
    const url = json.record?.[jobId];

    if (url) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      };
    }

    return { statusCode: 202, body: JSON.stringify({ status: "pending" }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Status lookup failed" };
  }
}
