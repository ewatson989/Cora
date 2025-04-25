const promptEl     = document.getElementById("prompt");
const textBtn      = document.getElementById("generateText");
const imageBtn     = document.getElementById("generateImage");
const chatLogEl    = document.getElementById("chatLog");
const outputEl     = document.getElementById("output");
const chatForm     = document.getElementById("chatForm");
const tempSlider   = document.getElementById("temperature");
const tempLabel    = document.getElementById("tempValue");
const viewBtn      = document.getElementById("viewMemories");
const memoryPanel  = document.getElementById("memoryPanel");

let messages = [];

// 🎚️ Update temp label in real time
tempSlider?.addEventListener("input", () => {
  tempLabel.textContent = tempSlider.value;
});

// ⏎ Submit with Enter (but Shift+Enter makes newline)
promptEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

// 🌐 Utility for POST requests
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

// 🧠 Submit text prompt to assistant
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userPrompt = promptEl.value.trim();
  if (!userPrompt) return;

  messages.push({ role: "user", content: userPrompt });
  updateChatLog("user", userPrompt);
  promptEl.value = "";
  outputEl.innerHTML = "";

  const temperature = parseFloat(tempSlider?.value || "0.7");

  try {
    const { text } = await postJSON("/.netlify/functions/generate-text", {
      messages,
      temperature
    });
    messages.push({ role: "assistant", content: text });
    updateChatLog("assistant", text);
  } catch (err) {
    updateChatLog("assistant", "⚠️ Error: " + err.message);
  }
});

// 🖼️ Generate image
imageBtn?.addEventListener("click", async () => {
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

// 📝 Render chat
function updateChatLog(role, text) {
  const id = crypto.randomUUID();
  const html = marked.parse(text);
  const outer = document.createElement("div");
  outer.className = `chat-message ${role}`;

  outer.innerHTML = `
    <div class="bubble" id="${id}">
      ${html}
      ${
        role === "assistant"
          ? `<div class="toolbar">
               <button class="copy-btn" title="Copy">📋</button>
               <button class="save-btn" title="Save to Cora Memory">💾</button>
             </div>`
          : ""
      }
    </div>`;

  chatLogEl.appendChild(outer);
  chatLogEl.scrollTop = chatLogEl.scrollHeight;

  if (role === "assistant") {
    const bubble = document.getElementById(id);
    const copyBtn = bubble.querySelector(".copy-btn");
    const saveBtn = bubble.querySelector(".save-btn");

    copyBtn?.addEventListener("click", () =>
      copyToClipboard(bubble.innerText.trim(), copyBtn)
    );

    saveBtn?.addEventListener("click", () =>
      saveToMemory({ type: "text", content: text, date: new Date().toISOString() })
    );
  }
}

// 📋 Copy to clipboard
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = "✅";
    setTimeout(() => (btn.textContent = old), 1500);
  });
}

// 💾 Save to cloud memory
async function saveToMemory(entry) {
  try {
    await postJSON("/.netlify/functions/save-memory", entry);
    alert("Saved to Cora Memory!");
  } catch (err) {
    alert("Failed to save: " + err.message);
  }
}

// 📖 Load memories
viewBtn?.addEventListener("click", async () => {
  if (!memoryPanel.hidden) {
    memoryPanel.hidden = true;
    return;
  }

  try {
    const entries = await postJSON("/.netlify/functions/get-memories", {});
    memoryPanel.innerHTML = entries.length
      ? entries.map(item => `
          <div class="memory-item">
            <strong>${new Date(item.date).toLocaleString()}:</strong><br/>
            ${item.content}
          </div>`).join("")
      : "<p>No memories yet!</p>";

    memoryPanel.hidden = false;
  } catch (err) {
    memoryPanel.innerHTML = `<p class="error">${err.message}</p>`;
    memoryPanel.hidden = false;
  }
});
