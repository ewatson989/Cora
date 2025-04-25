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
const voiceSelect  = document.getElementById("voiceSelect");
const listeningStatus = document.getElementById("listeningStatus");

let messages = [];
let availableVoices = [];
let listenTimeout = null;

// 🎙️ Load English-only voices
function populateVoices() {
  const allVoices = speechSynthesis.getVoices();
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

// 🧠 Submit text prompt
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

// 📋 Copy to clipboard
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = "✅";
    setTimeout(() => (btn.textContent = old), 1500);
  });
}

// 📝 Render chat
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

// 🗣️ Speak out loud
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  const selectedIndex = parseInt(voiceSelect.value);
  if (availableVoices[selectedIndex]) {
    utter.voice = availableVoices[selectedIndex];
  }
  utter.rate = 1;
  utter.pitch = 1;
  utter.lang = "en-US";
  utter.onend = () => {
    if (voiceToggle.checked) startListening(); // Only restart if Voice Mode is on
  };
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

// 🎤 Voice Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognizer = SpeechRecognition ? new SpeechRecognition() : null;

function startListening() {
  if (!recognizer) return;
  recognizer.start();
  listeningStatus?.classList.remove("hidden");

  listenTimeout = setTimeout(() => {
    recognizer.abort();
    listeningStatus?.classList.add("hidden");
    alert("Still there? Tap the mic when you're ready.");
  }, 5000);
}

function stopListening() {
  recognizer?.abort();
  clearTimeout(listenTimeout);
  listeningStatus?.classList.add("hidden");
}

if (recognizer) {
  recognizer.lang = "en-US";
  recognizer.interimResults = false;
  recognizer.continuous = false;

  recognizer.onresult = (e) => {
    clearTimeout(listenTimeout);                    // ✅ prevent false timeout
    const speech = e.results[0][0].transcript.trim();
    stopListening();                                // ✅ hide SparkleBot
    if (speech) {
      promptEl.value = speech;
      chatForm.requestSubmit();
    } else {
      alert("I didn’t catch that. Try again?");
    }
  };

  recognizer.onerror = () => {
    clearTimeout(listenTimeout);                    // ✅ cancel timer
    stopListening();
    alert("Oops! Something went wrong. Try again?");
  };
}

// 🎙️ Mic button
micButton?.addEventListener("click", () => {
  if (!recognizer) {
    alert("Voice input not supported.");
    return;
  }
  if (!voiceToggle.checked) {
    alert("Voice Mode is off. Turn it on to use the mic.");
    return;
  }
  startListening();
});

// 🔘 Voice Mode toggle
voiceToggle.addEventListener("change", () => {
  if (!recognizer) {
    alert("Voice input not supported on this browser.");
    voiceToggle.checked = false;
    return;
  }
  if (voiceToggle.checked) {
    startListening();
  } else {
    stopListening();
  }
});
