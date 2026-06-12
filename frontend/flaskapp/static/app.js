const config = window.RID_CONFIG || {};
const chatHistory = document.querySelector("#chat-history");
const chatForm = document.querySelector("#chat-form");
const questionInput = document.querySelector("#question-input");
const sendButton = document.querySelector("#send-button");
const clearHistoryButton = document.querySelector("#clear-history");
const newSessionButton = document.querySelector("#new-session");
const sessionIdNode = document.querySelector("#session-id");
const connectionStatus = document.querySelector("#connection-status");
const sampleList = document.querySelector("#sample-list");
const profilePhoto = document.querySelector("#profile-photo");

const STORAGE_KEY = "rid_chat_history";
const SESSION_KEY = "rid_session_id";

const sampleQuestions = [
  "What did Rajesh do at BPCL?",
  "What did Rajesh do at Medtronic?",
  "What should I know first about Rajesh Arigala?",
  "Show me Rajesh's strongest proof of systems thinking.",
  "Which parts of Rajesh's experience are most relevant for AI platforms?",
  "Where should I start if I am evaluating Rajesh for collaboration?"
];

let sessionId = getOrCreateSessionId();
let messages = loadMessages();

profilePhoto.addEventListener("error", () => {
  profilePhoto.classList.add("is-hidden");
});

function getOrCreateSessionId() {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const next = `RID-${date}-${suffix}`;
  localStorage.setItem(SESSION_KEY, next);
  return next;
}

function loadMessages() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function publicStatus(status) {
  return ["refused", "request failed"].includes(String(status || "").toLowerCase()) ? status : "";
}

function setStatus(text, state = "ready") {
  connectionStatus.textContent = text;
  connectionStatus.className = `status-pill ${state}`;
}

function renderSamples() {
  sampleList.innerHTML = "";
  sampleQuestions.forEach((question) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sample-button";
    button.textContent = question;
    button.addEventListener("click", () => {
      questionInput.value = question;
      questionInput.focus();
    });
    sampleList.appendChild(button);
  });
}

function renderMessages() {
  sessionIdNode.textContent = sessionId;
  chatHistory.innerHTML = "";

  const intro = {
    role: "assistant",
    text: `Hello. I'm ${config.assistantName || "Raj AI Concierge"}. I can answer professional questions about "${config.profileName || "Rajesh Arigala"}".`,
    meta: "Scope: work, projects, skills, and collaboration fit"
  };

  const renderedMessages = [
    { ...intro, messageIndex: "intro" },
    ...messages.map((message, index) => ({ ...message, messageIndex: String(index) }))
  ];

  renderedMessages.forEach((message) => {
    const article = document.createElement("article");
    article.className = `message ${message.role}`;
    article.dataset.messageIndex = message.messageIndex;
    const name = message.role === "user" ? "You" : (config.assistantName || "Raj AI Concierge");
    article.innerHTML = `
      <div class="message-head">
        <strong>${escapeHtml(name)}</strong>
        ${message.meta ? `<span>${escapeHtml(message.meta)}</span>` : ""}
      </div>
      <div class="message-body">${formatText(message.text, message.role)}</div>
    `;
    chatHistory.appendChild(article);
  });
  attachFollowupChoiceHandlers();
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function askQuestion(question, conversationContext) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      question,
      conversation_context: conversationContext
    })
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`API returned HTTP ${response.status} without JSON.`);
  }

  if (!response.ok) {
    const message = payload.error && payload.error.message ? payload.error.message : `API returned HTTP ${response.status}.`;
    throw new Error(message);
  }
  return payload;
}

questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const typedQuestion = questionInput.value.trim();
  if (!typedQuestion) return;
  const question = resolveChoiceReference(typedQuestion);
  const conversationContext = buildConversationParcel();

  messages.push({ role: "user", text: question });
  const assistantIndex = messages.length;
  messages.push({ role: "assistant", text: "Preparing a focused answer...", meta: "Thinking" });
  questionInput.value = "";
  saveMessages();
  renderMessages();

  sendButton.disabled = true;
  questionInput.disabled = true;
  setStatus("Thinking", "loading");

  try {
    const payload = await askQuestion(question, conversationContext);
    const meta = payload.model_id ? `Model: ${payload.model_id}` : publicStatus(payload.status);
    await streamAssistantMessage(assistantIndex, payload.answer || "No answer returned.", meta);
    setStatus("Connected", "ready");
  } catch (error) {
    messages[assistantIndex] = { role: "assistant", text: `I could not reach Raj Intelligence Desk API. ${error.message}`, meta: "Request failed" };
    setStatus("API Error", "error");
    renderMessages();
  } finally {
    sendButton.disabled = false;
    questionInput.disabled = false;
    saveMessages();
    questionInput.focus();
  }
});

clearHistoryButton.addEventListener("click", () => {
  messages = [];
  saveMessages();
  renderMessages();
});

newSessionButton.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(STORAGE_KEY);
  sessionId = getOrCreateSessionId();
  messages = [];
  renderMessages();
  setStatus("New Session", "ready");
});

async function streamAssistantMessage(messageIndex, finalText, meta) {
  const text = String(finalText || "");
  messages[messageIndex] = { role: "assistant", text: "", meta };
  renderMessages();

  const body = chatHistory.querySelector(`[data-message-index="${messageIndex}"] .message-body`);
  const headMeta = chatHistory.querySelector(`[data-message-index="${messageIndex}"] .message-head span`);
  if (headMeta) headMeta.textContent = meta;
  if (!body) {
    messages[messageIndex].text = text;
    renderMessages();
    return;
  }

  const chunks = text.match(/.{1,18}(?:\s|$)/g) || [text];
  let rendered = "";
  for (const chunk of chunks) {
    rendered += chunk;
    body.innerHTML = `<span>${escapeHtml(rendered).replace(/\n/g, "<br>")}</span><span class="typing-cursor" aria-hidden="true"></span>`;
    chatHistory.scrollTop = chatHistory.scrollHeight;
    await wait(18);
  }

  messages[messageIndex].text = text;
  renderMessages();
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function buildConversationParcel() {
  return messages
    .slice(-6)
    .map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      text: String(message.text || "").slice(0, 900)
    }))
    .filter((message) => message.text.trim());
}

function resolveChoiceReference(value) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const firstChoice = /^(first|option 1|1|one|first option|i will go with first option|go with first option|choose first|select first)$/.test(normalized);
  const secondChoice = /^(second|option 2|2|two|second option|i will go with second option|go with second option|choose second|select second)$/.test(normalized);
  if (!firstChoice && !secondChoice) return value;

  const choices = getLastAssistantChoices();
  if (!choices.length) return value;
  return firstChoice ? choices[0] || value : choices[1] || value;
}

function getLastAssistantChoices() {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || message.role !== "assistant") continue;
    const choices = extractChoices(message.text);
    if (choices.length) return choices;
  }
  return [];
}

function extractChoices(text) {
  const listItems = String(text || "")
    .split(/\n/)
    .map((line, index) => {
      const match = line.trim().match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
      return match ? { index, text: match[1].trim() } : null;
    })
    .filter(Boolean);
  return listItems.slice(-2).map((item) => cleanChoiceLabel(item.text));
}


function cleanChoiceLabel(value) {
  return String(value || "")
    .replace(/^follow[- ]?up choice\s*\d+\s*[:.)-]?\s*/i, "")
    .replace(/^choice\s*\d+\s*[:.)-]?\s*/i, "")
    .trim();
}

function shortenChoiceLabel(value) {
  const words = cleanChoiceLabel(value).split(/\s+/).filter(Boolean);
  if (words.length <= 9) return words.join(" ");
  return `${words.slice(0, 9).join(" ")}...`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatText(value, role = "assistant") {
  const raw = String(value ?? "");
  if (role !== "assistant") return escapeHtml(raw).replace(/\n/g, "<br>");

  const lines = raw.split(/\n/);
  const listItems = lines
    .map((line, index) => ({ index, match: line.trim().match(/^(?:[-*•]|\d+[.)])\s+(.+)$/) }))
    .filter((item) => item.match);
  const choiceIndexes = new Set(listItems.slice(-2).map((item) => item.index));

  const html = [];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (/^follow[- ]?up choices?:\s*$/i.test(trimmed)) return;
    const match = trimmed.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (match && choiceIndexes.has(index)) {
      const choiceText = shortenChoiceLabel(match[1].trim());
      const fullChoiceText = cleanChoiceLabel(match[1].trim());
      html.push(`<button type="button" class="followup-choice" data-choice="${escapeHtml(fullChoiceText)}">${escapeHtml(choiceText)}</button>`);
    } else if (match) {
      html.push(`<div class="answer-bullet">${escapeHtml(match[1].trim())}</div>`);
    } else if (trimmed) {
      html.push(`<span>${escapeHtml(line)}</span>`);
    }
  });
  return html.join("<br>");
}

function attachFollowupChoiceHandlers() {
  chatHistory.querySelectorAll(".followup-choice").forEach((button) => {
    button.addEventListener("click", () => {
      questionInput.value = button.dataset.choice || button.textContent.trim();
      questionInput.focus();
    });
  });
}

renderSamples();
renderMessages();
setStatus("Ready", "ready");
