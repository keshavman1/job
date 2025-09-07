// frontend/src/components/People/ChatDrawer.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./People.css";

export default function ChatDrawer({ open, onClose, otherUser, apiBase }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (open && otherUser) {
      fetchMessages(otherUser._id);
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, otherUser]);

  const fetchMessages = async (otherId) => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${apiBase}/messages/${otherId}`, { headers, withCredentials: true });
      setMessages(res.data?.messages || []);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const sendMessage = async () => {
    if (!text.trim() || !otherUser) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(
        `${apiBase}/messages/${otherUser._id}`,
        { content: text.trim() },
        { headers, withCredentials: true }
      );
      const msg = res.data?.message;
      if (msg) {
        setMessages((m) => [...m, msg]);
      } else {
        // fallback push local message
        setMessages((m) => [...m, { sender: "me", receiver: otherUser._id, content: text.trim(), createdAt: new Date().toISOString() }]);
      }
      setText("");
      scrollToBottom();
    } catch (err) {
      console.error("send failed", err);
      alert("Failed to send message");
    }
  };

  if (!open) return null;

  return (
    <div className="chat-drawer-overlay" onClick={onClose}>
      <div className="chat-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="conv-avatar small">
              {otherUser?.profilePhotoPath ? <img src={otherUser.profilePhotoPath} alt={otherUser.name} /> : <div className="initial">{(otherUser?.name || "U").charAt(0).toUpperCase()}</div>}
            </div>
            <div>
              <div className="conv-name">{otherUser?.name}</div>
              <div className="muted small">{otherUser?.role}</div>
            </div>
          </div>

          <div>
            <button className="btn-muted small" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="chat-body">
          {loading ? <div className="muted small">Loading messages...</div> : null}
          <div className="chat-messages">
            {messages.map((m, idx) => {
              const mine = String(m.sender) === String(otherUser?._id) ? false : (m.sender === "me" || m.sender === undefined ? true : (String(m.sender) !== String(otherUser?._id)));
              // above logic: if sender id equals otherUser id => not mine; else assume mine (backend provides ids)
              return (
                <div key={idx} className={`chat-msg ${mine ? "mine" : "theirs"}`}>
                  <div className="chat-text">{m.content}</div>
                  <div className="chat-time muted small">{new Date(m.createdAt).toLocaleString()}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="chat-footer">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." />
          <div className="chat-actions">
            <button className="btn-primary" onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
