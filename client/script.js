const promptEl = document.getElementById("prompt");
const textBtn  = document.getElementById("generateText");
const imageBtn = document.getElementById("generateImage");
const chatLogEl = document.getElementById("chatLog");
const outputEl = document.getElementById("output");

let messages = [];

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
  const userPrompt = promptEl.value.trim();
  if (!userPrompt) return;

  messages.push({ role: "user", content: userPrompt });
  updateChatLog("user", userPrompt);
  promptEl.value = "";
  outputEl.textContent = "AI is thinking…";

  try {
    const { text } = await postJSON("/.netlify/functions/generate-text", { messages });
    messages.push({ role: "assistant", content: text });
    updateChatLog("assistant", text);
    outputEl.textContent = "";
  } catch (err) {
    outputEl.innerHTML = `<p class="error">${err.message}</p>`;
  }
});

imageBtn.addEventListener("click", async () => {
  const prompt = promptEl.value.trim();
  if (!prompt) return;

  outputEl.textContent = "Generating image...";

  try {
    const { jobId } = await postJSON("/.netlify/functions/generate-image-background", {
      prompt
    });

    outputEl.innerHTML = `<p>Image generation started. Please wait...</p>`;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/.netlify/functions/get-image-status?jobId=${jobId}`);
        const data = await res.json();

        if (data.url) {
          clearInterval(pollInterval);
          outputEl.innerHTML = `
            <p>✅ Image Ready:</p>
            <img src="${data.url}" alt="Generated image" />
            <p><a href="${data.url}" target="_blank">Open in new tab</a></p>
          `;
        }
      } catch (err) {
        console.error("Polling failed", err);
      }
    }, 3000); // Poll every 3 seconds

  } catch (err) {
    outputEl.innerHTML = `<p class="error">${err.message}</p>`;
  }
});

function updateChatLog(role, text) {
  const msgEl = document.createElement("div");
  msgEl.className = `chat-message ${role}`;
  msgEl.innerHTML = `<strong>${role === "user" ? "You" : "AI"}:</strong> ${text}`;
  chatLogEl.appendChild(msgEl);
  chatLogEl.scrollTop = chatLogEl.scrollHeight;
}
