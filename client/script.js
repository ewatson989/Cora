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
const voiceToggle  = document.getElementById("voiceToggle");
const micButton    = document.getElementById("micButton");

let messages = [];

const voiceSelect = document.getElementById("voiceSelect");
let availableVoices = [];

function populateVoices() {
  const allVoices = speechSynthesis.getVoices();

  // Only include English voices
  availableVoices = allVoices.filter(voice =>
    voice.lang.toLowerCase().startsWith("en")
  );

  voiceSelect.innerHTML = availableVoices
    .map((voice, i) => `<option value="${i}">${voice.name} (${voice.lang})</option>`)
    .join("");
}

speechSynthesis.onvoiceschanged = populateVoices;
populateVoices();


// 🎚️ Update slider label
tempSlider.addEventListener("input", () => {
  tempLabel.textContent = tempSlider.value;
});

// ⏎ Submit on Enter
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
  if (!res.ok && res.status !== 202) throw new Error("Request failed");
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// 🧠 Submit chat
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userPrompt = promptEl.value.trim();
  if (!userPrompt) return;

  messages.push({ role: "user", content: userPrompt });
  updateChatLog("user", userPrompt);
  promptEl.value = "";
  outputEl.innerHTML = "";

  const temperature = parseFloat(tempSlider.value);

  try {
    const { text } = await postJSON("/.netlify/functions/generate-text", {
      messages,
      temperature
    });
    messages.push({ role: "assistant", content: text });
    updateChatLog("assistant", text);
    if (voiceToggle.checked) speak(text);
  } catch (err) {
    updateChatLog("assistant", "⚠️ Error: " + err.message);
  }
});

// 🖼️ Generate image
imageBtn.addEventListener("click", async () => {
  const prompt = promptEl.value.trim();
  if (!prompt) return;
  outputEl.textContent = "Generating image…";
  try {
    const { url } = await postJSON("/.netlify/functions/generate-image", { prompt });
    outputEl.innerHTML = `<img src="${url}" alt="Generated image" />
      <p><a href="${url}" target="_blank">Open in new tab</a></p>`;
  } catch (err) {
    outputEl.innerHTML = `<p class="error">${err.message}</p>`;
  }
});

// 📋 Clipboard copy
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = "✅";
    setTimeout(() => (btn.textContent = old), 1500);
  });
}

// 📝 Add chat
function updateChatLog(role, text) {
  const id = crypto.randomUUID();
  const html = marked.parse(text);
  const outer = document.createElement("div");
  outer.className = `chat-message ${role}`;
  outer.innerHTML = `
    <div class="bubble" id="${id}">
      ${html}
      ${role === "assistant"
        ? `<div class="toolbar">
             <button class="copy-btn" title="Copy">📋</button>
             <button class="save-btn" title="Save to Cora Memory">💾</button>
           </div>`
        : ""}`;
  chatLogEl.appendChild(outer);
  chatLogEl.scrollTop = chatLogEl.scrollHeight;

  if (role === "assistant") {
    const bubble = document.getElementById(id);
    bubble.querySelector(".copy-btn")?.addEventListener("click", () =>
      copyToClipboard(bubble.innerText.trim(), bubble.querySelector(".copy-btn"))
    );
    bubble.querySelector(".save-btn")?.addEventListener("click", () =>
      saveToMemory({ type: "text", content: text, date: new Date().toISOString() })
    );
  }
}

// 💬 Speak response aloud
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  const selectedIndex = parseInt(voiceSelect.value);
  if (availableVoices[selectedIndex]) {
    utter.voice = availableVoices[selectedIndex];
  }
  utter.rate = 1;
  utter.pitch = 1;
  utter.lang = "en-US";
  speechSynthesis.speak(utter);
}


// 💾 Save memory
async function saveToMemory(entry) {
  try {
    await postJSON("/.netlify/functions/save-memory", entry);
    alert("Saved to Cora Memory!");
  } catch (err) {
    alert("Failed to save: " + err.message);
  }
}

// 📖 Load saved memories
viewBtn.addEventListener("click", async () => {
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

// 🎤 Mic input → text
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognizer = SpeechRecognition ? new SpeechRecognition() : null;

if (recognizer) {
  recognizer.lang = "en-US";
  recognizer.interimResults = false;
  recognizer.continuous = false;

  recognizer.onresult = (e) => {
    const speech = e.results[0][0].transcript;
    promptEl.value = speech;
    chatForm.requestSubmit();
  };

  recognizer.onerror = (e) => {
    alert("Oops! I didn’t catch that. Try again?");
  };
}

micButton?.addEventListener("click", () => {
  if (!recognizer) {
    alert("Voice input not supported on this browser.");
    return;
  }
  recognizer.start();
});
