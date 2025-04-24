const promptEl = document.getElementById("prompt");
const textBtn  = document.getElementById("generateText");
const imageBtn = document.getElementById("generateImage");
const outputEl = document.getElementById("output");

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

textBtn.addEventListener("click", async () => {
  outputEl.textContent = "Loading …";
  try {
    const { text } = await postJSON("/.netlify/functions/generate-text", {
      prompt: promptEl.value
    });
    outputEl.innerHTML = `<p>${text}</p>`;
  } catch (err) {
    outputEl.innerHTML = `<p class="error">${err.message}</p>`;
  }
});

imageBtn.addEventListener("click", async () => {
  outputEl.textContent = "Loading image…";
  try {
    const { url } = await postJSON("/.netlify/functions/generate-image", {
      prompt: promptEl.value
    });
    outputEl.innerHTML = `<img src="\${url}" alt="Generated image"/>`;
  } catch (err) {
    outputEl.innerHTML = `<p class="error">${err.message}</p>`;
  }
});
