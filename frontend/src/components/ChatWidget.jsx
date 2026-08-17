import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { sendChatMessage, resetChatSession } from "../api/client";

const SESSION_ID = "web-session-1";

const SUGGESTIONS = [
  "What's our total revenue this year?",
  "Which product category is growing fastest?",
  "What's our gross margin?",
  "How's customer retention looking?",
];

const WELCOME = {
  role: "assistant",
  content:
    "Hi, I'm Aria — your sales analytics assistant. Ask me anything about revenue, products, finance, or customers.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  async function handleSend(text) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setSending(true);
    try {
      const res = await sendChatMessage(message, SESSION_ID);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Sorry, I hit an error: ${e.response?.data?.detail || e.message}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleReset() {
    await resetChatSession(SESSION_ID);
    setMessages([{ role: "assistant", content: "Conversation cleared. What would you like to know?" }]);
  }

  return (
    <>
      <button
        className={`chat-fab ${open ? "hidden" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Open sales assistant chat"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 4h16v12H7l-3 3V4z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className="chat-popup-overlay" onClick={() => setOpen(false)}>
          <div className="chat-popup" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Sales assistant chat">
            <div className="chat-popup-header">
              <div className="chat-popup-title">
                <span className="chat-status-dot" />
                Aria — Sales Assistant
              </div>
              <div className="chat-popup-actions">
                <button className="btn-icon" onClick={handleReset} title="Clear conversation">
                  ⟲
                </button>
                <button className="btn-icon" onClick={() => setOpen(false)} title="Close" aria-label="Close chat">
                  ✕
                </button>
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.role}`}>
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ))}
              {sending && (
                <div className="chat-bubble assistant">
                  <span className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {messages.length <= 1 && (
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="suggestion-chip" onClick={() => handleSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              className="chat-input-row"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about sales, products, finance…"
                disabled={sending}
              />
              <button type="submit" disabled={sending || !input.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
