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

  outputEl.textContent = "Generating image…";
  try {
    const { url } = await postJSON("/.netlify/functions/generate-image", { prompt });
    outputEl.innerHTML = `<img src="${url}" alt="Generated image" />`;
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
