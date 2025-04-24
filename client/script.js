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

  // Allow 202 (Accepted) with empty body from background functions
  if (!res.ok && res.status !== 202) {
    throw new Error("Request failed");
  }

  const text = await res.text();
  return text ? JSON.parse(text) : {};   // Won’t crash on empty body
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

  outputEl.textContent = "Generating image…";

  try {
    const { jobId } = await postJSON(
      "/.netlify/functions/generate-image-background",
      { prompt }
    );

    outputEl.innerHTML = `<p>Image is cooking… (job ${jobId})</p>`;

    const poll = setInterval(async () => {
      const res = await fetch(
        `/.netlify/functions/get-image-status?jobId=${jobId}`
      );
      if (res.status === 202) return;          // still pending
      clearInterval(poll);

      const { url } = await res.json();
      outputEl.innerHTML = `
        <img src="${url}" alt="AI image" />
        <p><a href="${url}" target="_blank">Open in new tab</a></p>`;
    }, 3000);                                  // poll every 3 s
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
