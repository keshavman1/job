// frontend/src/components/Chat/ChatDialog.jsx
import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import { socket } from "/src/socket.js";
import { Context } from "/src/context.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api/v1";

export default function ChatDialog({ otherUser, onClose }) {
  const { user: currentUser } = useContext(Context);
  const [messages, setMessages] = useState([]);
  const messageIdsRef = useRef(new Set()); // track added message IDs to avoid duplicates
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const listRef = useRef(null);

  // helper: safe add message (dedupe by _id if present)
  const addMessageSafe = (msg) => {
    // If msg has _id, use it for dedupe. If not, create a temporary id (rare).
    const id = msg?._id ? String(msg._id) : `temp-${msg.createdAt || Date.now()}-${Math.random()}`;
    if (messageIdsRef.current.has(id)) return false;
    messageIdsRef.current.add(id);
    setMessages((prev) => [...prev, msg]);
    return true;
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/messages/${otherUser._id}`, { withCredentials: true });
        const msgs = res.data?.messages || [];
        if (!mounted) return;

        // populate id set and messages (in chronological order)
        messageIdsRef.current = new Set(msgs.map((m) => String(m._id)));
        setMessages(msgs);
        setTimeout(() => scrollToBottom(), 50);
      } catch (err) {
        console.error("load messages", err);
        // show a user-friendly message optionally
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    // handlers - only append if not already present
    const handleReceive = (payload) => {
      // payload: { _id, from, to, content, createdAt } (server emits this shape)
      if (!payload) return;
      // only append if it's for this conversation
      const isForThisConversation =
        (String(payload.from) === String(otherUser._id) && String(payload.to) === String(currentUser._id)) ||
        (String(payload.from) === String(currentUser._id) && String(payload.to) === String(otherUser._id));
      if (!isForThisConversation) return;
      addMessageSafe({
        _id: payload._id,
        sender: payload.from,
        receiver: payload.to,
        content: payload.content,
        createdAt: payload.createdAt,
      });
      scrollToBottom();
    };

    // server might emit different events; listen to both
    socket.on("receive-message", handleReceive);
    socket.on("message-sent", handleReceive);

    return () => {
      mounted = false;
      socket.off("receive-message", handleReceive);
      socket.off("message-sent", handleReceive);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUser._id]);

  const scrollToBottom = () => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight + 100;
  };

  const sendMessage = async () => {
    const content = text?.trim();
    if (!content) return;
    setText("");

    try {
      // POST to API; server persists and emits to recipients
      const res = await axios.post(
        `${API_BASE}/messages/${otherUser._id}`,
        { content },
        { withCredentials: true }
      );

      const msg = res.data?.message;
      if (msg) {
        // server returns the saved message (with _id) — add it via addMessageSafe
        const normalized = {
          _id: msg._id,
          sender: msg.sender,
          receiver: msg.receiver,
          content: msg.content,
          createdAt: msg.createdAt,
        };
        addMessageSafe(normalized);
        scrollToBottom();
      } else {
        // fallback: construct a minimal optimistic message (no id)
        addMessageSafe({
          _id: `temp-${Date.now()}-${Math.random()}`,
          sender: currentUser._id,
          receiver: otherUser._id,
          content,
          createdAt: new Date().toISOString(),
        });
        scrollToBottom();
      }
    } catch (err) {
      console.error("send message", err);
      alert(err?.response?.data?.message || "Failed to send message");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl h-[80vh] rounded shadow-lg flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              {otherUser.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="font-semibold">{otherUser.name}</div>
              <div className="text-sm text-gray-600">You can now chat</div>
            </div>
          </div>
          <div>
            <button className="px-3 py-1" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500">No messages yet. Say hello 👋</div>
          ) : (
            messages.map((m) => {
              const mine = String(m.sender) === String(currentUser?._id);
              return (
                <div key={String(m._id || `${m.createdAt}-${Math.random()}`)} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] p-2 rounded ${mine ? "bg-blue-600 text-white" : "bg-white text-gray-800 border"}`}>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div className="text-xs text-gray-400 mt-1 text-right">{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Write a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
