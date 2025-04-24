export async function handler(event) {
  const jobId = event.queryStringParameters.jobId;
  if (!jobId) {
    return { statusCode: 400, body: "Missing jobId" };
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${jobId}/latest`, {
      method: "GET",
      headers: {
        "X-Master-Key": process.env.JSONBIN_API_KEY
      }
    });

    const json = await response.json();

    if (json.record?.url) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: json.record.url })
      };
    }

    return { statusCode: 202, body: JSON.stringify({ status: "pending" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Status check failed" }) };
  }
}
