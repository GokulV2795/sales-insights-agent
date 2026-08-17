import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { sendChatMessage, resetChatSession } from "../api/client";

const SESSION_ID = "web-session-1";

const SUGGESTIONS = [
  "What's our total revenue this year?",
  "Which product category is growing fastest?",
  "Compare North America vs Europe revenue",
  "What's our refund rate and why might it matter?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi, I'm Aria — your sales analytics assistant. Ask me anything about revenue, products, regions, or customers." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

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
    <div className="page-pad chat-page">
      <div className="page-header">
        <h1>Sales Assistant</h1>
        <button className="btn-ghost" onClick={handleReset}>
          Clear conversation
        </button>
      </div>

      <div className="chat-window card">
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about sales, products, regions…"
            disabled={sending}
          />
          <button type="submit" disabled={sending || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
