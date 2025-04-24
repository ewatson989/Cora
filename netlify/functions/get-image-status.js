export async function handler(event) {
  const jobId = event.queryStringParameters.jobId;
  if (!jobId) return { statusCode: 400, body: "Missing jobId" };

  try {
    // Find the bin that stores this jobId
    const res = await fetch(
      `https://api.jsonbin.io/v3/c/` +      // list collection
      `?meta=false`,                        // no metadata
      { headers: { "X-Master-Key": process.env.JSONBIN_API_KEY } }
    );
    const bins = await res.json();

    // Search for the record with that jobId
    const bin = bins.find((b) => b.jobId === jobId);

    if (bin?.url) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: bin.url })
      };
    }

    return { statusCode: 202, body: JSON.stringify({ status: "pending" }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Status lookup failed" };
  }
}
