let chatMessages = [];
let chatOpen = false;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await StudentPortal.initShell();
    bindChatEvents();
  } catch (error) {
    if (error.message !== "Unauthenticated") {
      Toast.error("Failed to load AI assistant page");
    }
  }
});

function bindChatEvents() {
  document.getElementById("openChatBtn").addEventListener("click", toggleChat);
  document.getElementById("clearChatBtn").addEventListener("click", clearChatHistory);
  document.getElementById("sendChatBtn").addEventListener("click", sendChatMessage);
  document.getElementById("chatInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendChatMessage();
    }
  });
}

async function toggleChat() {
  chatOpen = !chatOpen;

  document.getElementById("chatContainer").classList.toggle("hidden", !chatOpen);
  document.getElementById("chatPlaceholder").classList.toggle("hidden", chatOpen);
  document.getElementById("openChatBtn").textContent = chatOpen ? "Close Chat" : "Open Chat";

  if (chatOpen) {
    await loadChatHistory();
  }
}

async function loadChatHistory() {
  try {
    const response = await StudentPortal.api.ai.history();
    chatMessages = StudentPortal.normalizeItems(response).flatMap((row) => ([
      { role: "user", text: row.userMessage },
      { role: "ai", text: row.aiResponse },
    ]));
    renderChatLog();
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to load chat history");
  }
}

function renderChatLog() {
  const log = document.getElementById("chatLog");

  if (!chatMessages.length) {
    log.innerHTML = `
      <div class="chat-row ai">
        <div class="bubble">Hello. I am your AI Study Assistant. Ask me about courses, skills, or interview preparation.</div>
      </div>
    `;
    return;
  }

  log.innerHTML = chatMessages.map((msg) => `
    <div class="chat-row ${msg.role}">
      <div class="bubble">${StudentPortal.helpers.escapeHtml(msg.text || "")}</div>
    </div>
  `).join("");
  log.scrollTop = log.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  chatMessages.push({ role: "user", text: message });
  renderChatLog();

  try {
    const profile = await StudentPortal.api.profile.get().catch(() => ({}));
    const response = await StudentPortal.api.ai.send(message, {
      department: profile.department,
      yearOfStudy: profile.yearOfStudy,
      cgpa: profile.cgpa,
      skills: profile.skills,
    });

    chatMessages.push({ role: "ai", text: response.message || "No response" });
    renderChatLog();
  } catch (error) {
    console.error(error);
    chatMessages.push({ role: "ai", text: "Failed to fetch AI response. Please retry." });
    renderChatLog();
  }
}

async function clearChatHistory() {
  if (!window.confirm("Clear AI chat history?")) return;

  try {
    await StudentPortal.api.ai.clear();
    chatMessages = [];
    renderChatLog();
    Toast.success("Chat history cleared");
  } catch (error) {
    console.error(error);
    Toast.error(error.message || "Failed to clear chat history");
  }
}
