function createJobId() {
  return crypto.randomUUID();
}


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

// ── copy helper ──────────────────────────────
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = "✅";
    setTimeout(() => (btn.textContent = old), 1500);
  });
}

// ── emoji reaction helper (optional analytics stub) ──────────
function sendReaction(jobId, emoji) {
  console.log("Reaction for message", jobId, emoji);
  // You could POST this to a logging endpoint later
}


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
    const { url } = await postJSON("/.netlify/functions/generate-image", { prompt });
    outputEl.innerHTML = `
      <img src="${url}" alt="Generated image" />
      <p><a href="${url}" target="_blank">Open in new tab</a></p>`;
  } catch (err) {
    outputEl.innerHTML = `<p class="error">${err.message}</p>`;
  }
});


function updateChatLog(role, text) {
  const id = crypto.randomUUID();              // unique id for copy+emoji
  const html = marked.parse(text);

  const outer = document.createElement("div");
  outer.className = `chat-message ${role}`;

  // Bubble with HTML + toolbar
  outer.innerHTML = `
    <div class="bubble" id="${id}">
      ${html}
      ${
        role === "assistant"
          ? `<div class="toolbar">
               <button class="copy-btn" title="Copy">📋</button>
               <span class="emoji-btn">😊</span>
               <span class="emoji-btn">😲</span>
               <span class="emoji-btn">🤔</span>
               <span class="emoji-btn">👎</span>
             </div>`
          : ""
      }
    </div>`;

  chatLogEl.appendChild(outer);
  chatLogEl.scrollTop = chatLogEl.scrollHeight;

  // wire up copy & emoji only for assistant
  if (role === "assistant") {
    const bubble   = document.getElementById(id);
    const copyBtn  = bubble.querySelector(".copy-btn");
    const emojiBtns = bubble.querySelectorAll(".emoji-btn");

    copyBtn.addEventListener("click", () =>
      copyToClipboard(bubble.innerText.trim(), copyBtn)
    );

    emojiBtns.forEach(btn =>
      btn.addEventListener("click", () => sendReaction(id, btn.textContent))
    );
  }
}


