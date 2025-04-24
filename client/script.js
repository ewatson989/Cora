const promptEl   = document.getElementById("prompt");
const textBtn    = document.getElementById("generateText");
const imageBtn   = document.getElementById("generateImage"); // ✅ added
const chatLogEl  = document.getElementById("chatLog");
const outputEl   = document.getElementById("output");
const chatForm   = document.getElementById("chatForm");

let messages = [];

promptEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok && res.status !== 202) {
    throw new Error("Request failed");
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userPrompt = promptEl.value.trim();
  if (!userPrompt) return;

  messages.push({ role: "user", content: userPrompt });
  updateChatLog("user", userPrompt);
  promptEl.value = "";
  outputEl.innerHTML = "";

  try {
    const { text } = await postJSON("/.netlify/functions/generate-text", { messages });
    messages.push({ role: "assistant", content: text });
    updateChatLog("assistant", text);
  } catch (err) {
    updateChatLog("assistant", "⚠️ Error: " + err.message);
  }
});

// ✅ Handle image generation
imageBtn.addEventListener("click", async () => {
  const prompt = promptEl.value.trim();
  if (!prompt) return;

  outputEl.textContent = "Generating image…";

  try {
    const { url } = await postJSON("/.netlify/functions/generate-image", { prompt });
    outputEl.innerHTML = `
      <img src="${url}" alt="Generated image" />
      <p><a href="${url}" target="_blank">Open in new tab</a></p>
    `;
  } catch (err) {
    outputEl.innerHTML = `<p class="error">${err.message}</p>`;
  }
});

function updateChatLog(role, text) {
  const id = crypto.randomUUID();
  const html = marked.parse(text);
  const outer = document.createElement("div");
  outer.className = `chat-message ${role}`;

  outer.innerHTML = `
    <div class="bubble" id="${id}">
      ${html}
${ role === "assistant" ? `<div class="toolbar"><button class="copy-btn" title="Copy">📋</button></div>` : "" }

    </div>`;

  chatLogEl.appendChild(outer);
  chatLogEl.scrollTop = chatLogEl.scrollHeight;

  if (role === "assistant") {
    const bubble = document.getElementById(id);
    const copyBtn = bubble.querySelector(".copy-btn");
    const emojiBtns = bubble.querySelectorAll(".emoji-btn");

    copyBtn.addEventListener("click", () =>
      copyToClipboard(bubble.innerText.trim(), copyBtn)
    );

    emojiBtns.forEach((btn) =>
      btn.addEventListener("click", () => sendReaction(id, btn.textContent))
    );
  }
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = "✅";
    setTimeout(() => (btn.textContent = old), 1500);
  });
}

function sendReaction(jobId, emoji) {
  console.log("Reaction for message", jobId, emoji);
  // you can send this to a webhook or store later
}
